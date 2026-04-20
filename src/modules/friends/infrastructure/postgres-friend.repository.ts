import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { FriendRepository } from '../domain/friend.repository';
import { Friendship } from '../domain/friend.entity';
import { PG_POOL } from '../../../shared/infrastructure/database/postgres/postgres.module';
@Injectable()
export class PostgresFriendRepository implements FriendRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async findById(id: string): Promise<Friendship | null> {
    const query = 'SELECT * FROM friends WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }
  async findByUsers(userId1: string, userId2: string): Promise<Friendship | null> {
    const query = 'SELECT * FROM friends WHERE (user_id = $1 AND friend_user_id = $2) OR (user_id = $2 AND friend_user_id = $1)';
    const result = await this.pool.query(query, [userId1, userId2]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }
  async findPendingRequests(userId: string): Promise<any[]> {
    const query = `
      SELECT f.id, f.status, f.created_at as "createdAt", u.id as "userId", u.display_name as "displayName", u.avatar_url as "avatarUrl"
      FROM friends f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_user_id = $1 AND f.status = 'PENDING'
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }
  async findAcceptedFriends(userId: string): Promise<any[]> {
    const query = `
      SELECT u.id, u.display_name as "displayName", u.avatar_url as "avatarUrl", f.created_at as "friendSince"
      FROM friends f
      JOIN users u ON (u.id = CASE WHEN f.user_id = $1 THEN f.friend_user_id ELSE f.user_id END)
      WHERE (f.user_id = $1 OR f.friend_user_id = $1) AND f.status = 'ACCEPTED'
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }
  async save(friendship: Friendship): Promise<Friendship> {
    const query = `
      INSERT INTO friends (id, user_id, friend_user_id, status, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      ON CONFLICT (id) DO UPDATE SET 
        status = EXCLUDED.status, 
        updated_at = EXCLUDED.updated_at 
      RETURNING *;
    `;
    const result = await this.pool.query(query, [
      friendship.id,
      friendship.userId,
      friendship.friendId,
      friendship.status,
      friendship.createdAt,
      friendship.updatedAt,
    ]);
    return this.mapToEntity(result.rows[0]);
  }
  private mapToEntity(row: any): Friendship {
    return new Friendship(
      row.id,
      row.user_id,
      row.friend_user_id,
      row.status,
      row.created_at,
      row.updated_at,
    );
  }
}
