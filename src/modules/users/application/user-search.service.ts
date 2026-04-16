import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';

@Injectable()
export class UserSearchService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async searchUsers(query: string, currentUserId: string, limit: number = 20): Promise<any[]> {
    if (!query || query.trim() === '') return [];
    
    // We could optimize this with Postgres Trigram indexes if the list grows.
    const sql = `
      SELECT id, display_name as "displayName", avatar_url as "avatarUrl"
      FROM users
      WHERE display_name ILIKE $1 AND id != $2
      LIMIT $3
    `;
    const result = await this.pool.query(sql, [`%${query}%`, currentUserId, limit]);
    
    // To attach 'isFriend' and 'status' properly, we'd need to join with friendship table.
    // For now, we do a basic subquery or join, or handle default states.
    // Assuming a simple 'friends' table structure: user_id, friend_id, status
    const enhancedSql = `
      SELECT 
        u.id, 
        u.display_name as "displayName", 
        u.avatar_url as "avatarUrl",
        f.status as "friendStatus"
      FROM users u
      LEFT JOIN friends f ON (f.user_id = $2 AND f.friend_id = u.id) OR (f.friend_id = $2 AND f.user_id = u.id)
      WHERE u.display_name ILIKE $1 AND u.id != $2
      LIMIT $3
    `;
    const advancedResult = await this.pool.query(enhancedSql, [`%${query}%`, currentUserId, limit]);

    return advancedResult.rows.map((r: any) => ({
      id: r.id,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      isFriend: r.friendStatus === 'ACCEPTED',
      status: r.friendStatus || null,
    }));
  }
}
