import { Module, Controller, Get, Post, Body, Param, Query, Req, UseGuards, Injectable, Inject } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { MONGO_DB } from '../database/database.module';
import { MessagesGateway } from './presentation/messages.gateway';
export class Message {
  constructor(
    public readonly id: string, 
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly receiverId: string,
    public readonly content: string,
    public readonly playbackEventId: string | null,
    public readonly read: boolean,
    public readonly readAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
@Injectable()
export class MessagesRepository {
  constructor(@Inject(MONGO_DB) private readonly db: Db) {}
  private get collection() {
    return this.db.collection('messages');
  }
  async getMessagesByConversation(conversationId: string, limit: number = 50, skip: number = 0): Promise<any[]> {
    const messages = await this.collection
      .find({ conversation_id: conversationId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return messages.map(m => ({
      id: m.id || m._id.toString(),
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      content: m.content,
      playbackEventId: m.playback_event_id,
      read: m.read,
      readAt: m.read_at,
      createdAt: m.created_at,
    }));
  }
  async markAsRead(conversationId: string, receiverId: string): Promise<number> {
    const filter = {
      conversation_id: conversationId,
      receiver_id: receiverId,
      read: false,
    };
    const result = await this.collection.updateMany(filter, {
      $set: { read: true, read_at: new Date() },
    });
    return result.modifiedCount;
  }
  async save(message: Message): Promise<Message> {
    await this.collection.insertOne({
      id: message.id,
      conversation_id: message.conversationId,
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      content: message.content,
      playback_event_id: message.playbackEventId,
      read: message.read,
      read_at: message.readAt,
      created_at: message.createdAt,
    });
    return message;
  }
}
@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly repo: MessagesRepository) {}
  @Get('conversations/:id/messages')
  async getMessages(@Param('id') conversationId: string, @Query('limit') limit?: string, @Query('skip') skip?: string) {
    const l = limit ? parseInt(limit, 10) : 50;
    const s = skip ? parseInt(skip, 10) : 0;
    const items = await this.repo.getMessagesByConversation(conversationId, l, s);
    return {
      items,
      nextCursor: items.length === l ? s + l : null,
    };
  }
  @Post('messages/read')
  async markRead(@Body() body: any, @Req() req: any) {
    const updatedCount = await this.repo.markAsRead(body.conversationId, req.user.userId);
    return { updatedCount };
  }
}
@Module({
  imports: [AuthModule],
  controllers: [MessagesController],
  providers: [MessagesRepository, MessagesGateway],
  exports: [MessagesRepository],
})
export class MessagesModule {}
