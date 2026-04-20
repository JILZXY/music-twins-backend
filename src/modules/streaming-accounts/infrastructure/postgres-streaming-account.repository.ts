import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { StreamingAccountRepository } from '../domain/streaming-account.repository';
import { StreamingAccount } from '../domain/streaming-account.entity';
import { PG_POOL } from '../../database/database.module';
@Injectable()
export class PostgresStreamingAccountRepository implements StreamingAccountRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async findByUserId(userId: string): Promise<StreamingAccount | null> {
    const query = 'SELECT * FROM streaming_accounts WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }
  async findByProviderAccountId(providerAccountId: string): Promise<StreamingAccount | null> {
    const query = 'SELECT * FROM streaming_accounts WHERE provider_account_id = $1';
    const result = await this.pool.query(query, [providerAccountId]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }
  async save(account: StreamingAccount): Promise<StreamingAccount> {
    const query = `
      INSERT INTO streaming_accounts (id, user_id, provider, provider_account_id, access_token, refresh_token, expires_at, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      ON CONFLICT (id) DO UPDATE SET 
        access_token = EXCLUDED.access_token, 
        refresh_token = EXCLUDED.refresh_token, 
        expires_at = EXCLUDED.expires_at,
        updated_at = EXCLUDED.updated_at 
      RETURNING *;
    `;
    const result = await this.pool.query(query, [
      account.id,
      account.userId,
      account.provider,
      account.providerAccountId,
      account.accessToken,
      account.refreshToken,
      account.expiresAt,
      account.createdAt,
      account.updatedAt,
    ]);
    return this.mapToEntity(result.rows[0]);
  }
  private mapToEntity(row: any): StreamingAccount {
    return new StreamingAccount(
      row.id,
      row.user_id,
      row.provider,
      row.provider_account_id,
      row.access_token,
      row.refresh_token,
      row.expires_at,
      row.created_at,
      row.updated_at,
    );
  }
}
