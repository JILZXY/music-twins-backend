import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../shared/infrastructure/database/postgres/postgres.module';
@Injectable()
export class UserSearchService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async searchUsers(
    query: string,
    currentUserId: string,
    limit: number = 20,
  ): Promise<any[]> {
    if (!query || query.trim() === '') return [];
    const sql = `
      SELECT id, display_name as "displayName", avatar_url as "avatarUrl"
      FROM users
      WHERE display_name ILIKE $1 AND id != $2
      LIMIT $3
    `;
    const result = await this.pool.query(sql, [
      `%${query}%`,
      currentUserId,
      limit,
    ]);
    const enhancedSql = `
      SELECT 
        u.id, 
        u.display_name as "displayName", 
        u.avatar_url as "avatarUrl",
        f.status as "friendStatus"
      FROM users u
      LEFT JOIN friends f ON (f.user_id = $2 AND f.friend_user_id = u.id) OR (f.friend_user_id = $2 AND f.user_id = u.id)
      WHERE u.display_name ILIKE $1 AND u.id != $2
      LIMIT $3
    `;
    const advancedResult = await this.pool.query(enhancedSql, [
      `%${query}%`,
      currentUserId,
      limit,
    ]);
    return advancedResult.rows.map((r: any) => ({
      id: r.id,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      isFriend: r.friendStatus === 'ACCEPTED',
      status: r.friendStatus || null,
    }));
  }
}
