import { Module, Controller, Get, Post, Body, Req, UseGuards, Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { PG_POOL } from '../database/database.module';
export class Conversation {
  constructor(
    public readonly id: string,
    public readonly user1Id: string,
    public readonly user2Id: string,
    public readonly originPlaybackEventId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
@Injectable()
export class ConversationsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async createOrFind(user1Id: string, user2Id: string, originPlaybackEventId: string | null): Promise<Conversation> {
    const [u1, u2] = [user1Id, user2Id].sort();
    const fetchQuery = `SELECT * FROM conversations WHERE user1_id = $1 AND user2_id = $2`;
    const res = await this.pool.query(fetchQuery, [u1, u2]);
    if (res.rows.length > 0) {
      const r = res.rows[0];
      return new Conversation(r.id, r.user1_id, r.user2_id, r.origin_playback_event_id, r.created_at, r.updated_at);
    }
    const insertQuery = `
      INSERT INTO conversations (id, user1_id, user2_id, origin_playback_event_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const inserted = await this.pool.query(insertQuery, [uuidv4(), u1, u2, originPlaybackEventId, new Date(), new Date()]);
    const r = inserted.rows[0];
    return new Conversation(r.id, r.user1_id, r.user2_id, r.origin_playback_event_id, r.created_at, r.updated_at);
  }
  async findByUserId(userId: string): Promise<any[]> {
    const query = `
      SELECT 
        c.id as "conversationId",
        c.origin_playback_event_id as "originPlaybackEventId",
        c.updated_at as "updatedAt",
        u.id as "userId",
        u.display_name as "userDisplayName",
        u.avatar_url as "userAvatarUrl"
      FROM conversations c
      JOIN users u ON (u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END)
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.updated_at DESC
    `;
    const res = await this.pool.query(query, [userId]);
    return res.rows;
  }
}
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly repo: ConversationsRepository) {}
  @Get()
  async getConversations(@Req() req: any) {
    const items = await this.repo.findByUserId(req.user.userId);
    return items.map(item => ({
      id: item.conversationId,
      user: {
        id: item.userId,
        displayName: item.userDisplayName,
        avatarUrl: item.userAvatarUrl,
      },
      lastMessage: null, 
      unreadCount: 0,
      originPlaybackEventId: item.originPlaybackEventId,
    }));
  }
  @Post()
  async createConversation(@Body() body: any, @Req() req: any) {
    return this.repo.createOrFind(req.user.userId, body.targetUserId, body.originPlaybackEventId || null);
  }
}
@Module({
  controllers: [ConversationsController],
  providers: [ConversationsRepository],
  exports: [ConversationsRepository],
})
export class ConversationsModule {}
