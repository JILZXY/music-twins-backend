import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { UserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { PG_POOL } from '../../../shared/infrastructure/database/postgres/postgres.module';
@Injectable()
export class PostgresUserRepository implements UserRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async findById(id: string): Promise<User | null> {
    const query = 'SELECT id, spotify_id, display_name, email, avatar_url, created_at, updated_at FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return new User(row.id, row.spotify_id, row.display_name, row.email, row.avatar_url, row.created_at, row.updated_at);
  }
  async save(user: User): Promise<User> {
    const query = `
      INSERT INTO users (id, spotify_id, display_name, email, avatar_url, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      ON CONFLICT (id) DO UPDATE SET 
        display_name = EXCLUDED.display_name, 
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url, 
        updated_at = EXCLUDED.updated_at 
      RETURNING *;
    `;
    const result = await this.pool.query(query, [
      user.id,
      user.spotifyId,
      user.displayName,
      user.email,
      user.avatarUrl,
      user.createdAt,
      user.updatedAt,
    ]);
    const row = result.rows[0];
    return new User(row.id, row.spotify_id, row.display_name, row.email, row.avatar_url, row.created_at, row.updated_at);
  }
}
