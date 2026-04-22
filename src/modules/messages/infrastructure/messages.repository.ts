import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { MONGO_DB } from '../../../shared/infrastructure/database/mongo/mongo.module';
import { Message } from '../domain/message.entity';

@Injectable()
export class MessagesRepository {
  constructor(@Inject(MONGO_DB) private readonly db: Db) {}

  private get collection() {
    return this.db.collection('messages');
  }

  async getMessagesByConversation(
    conversationId: string,
    limit: number = 50,
    skip: number = 0,
  ): Promise<any[]> {
    const messages = await this.collection
      .find({ conversation_id: conversationId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return messages.map((m) => ({
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

  async markAsRead(
    conversationId: string,
    receiverId: string,
  ): Promise<number> {
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
