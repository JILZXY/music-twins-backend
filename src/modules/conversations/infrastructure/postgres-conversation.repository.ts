import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { PG_POOL } from '../../../shared/infrastructure/database/postgres/postgres.module';
import { ConversationRepository } from '../domain/conversation.repository';
import { Conversation, ConversationListItem } from '../domain/conversation.entity';

@Injectable()
export class PostgresConversationRepository implements ConversationRepository {
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
  
  async findByUserId(userId: string): Promise<ConversationListItem[]> {
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
    return res.rows.map(row => new ConversationListItem(
      row.conversationId,
      row.originPlaybackEventId,
      row.updatedAt,
      row.userId,
      row.userDisplayName,
      row.userAvatarUrl
    ));
  }
}
