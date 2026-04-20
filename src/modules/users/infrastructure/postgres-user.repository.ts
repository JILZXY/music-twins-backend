import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { UserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { PG_POOL } from '../../database/database.module';
@Injectable()
export class PostgresUserRepository implements UserRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async findById(id: string): Promise<User | null> {
    const query = 'SELECT id, display_name, avatar_url, created_at, updated_at FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return new User(row.id, row.display_name, row.avatar_url, row.created_at, row.updated_at);
  }
  async save(user: User): Promise<User> {
    const query = `
      INSERT INTO users (id, display_name, avatar_url, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (id) DO UPDATE SET 
        display_name = EXCLUDED.display_name, 
        avatar_url = EXCLUDED.avatar_url, 
        updated_at = EXCLUDED.updated_at 
      RETURNING *;
    `;
    const result = await this.pool.query(query, [
      user.id,
      user.displayName,
      user.avatarUrl,
      user.createdAt,
      user.updatedAt,
    ]);
    const row = result.rows[0];
    return new User(row.id, row.display_name, row.avatar_url, row.created_at, row.updated_at);
  }
}
