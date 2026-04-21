import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { StreamingAccountRepository } from '../domain/streaming-account.repository';
import { StreamingAccount } from '../domain/streaming-account.entity';
import { PG_POOL } from '../../../shared/infrastructure/database/postgres/postgres.module';

@Injectable()
export class PostgresStreamingAccountRepository implements StreamingAccountRepository {
  private readonly encryptionSecret: string;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly configService: ConfigService,
  ) {
    this.encryptionSecret = this.configService.get<string>('JWT_SECRET') || '';
  }

  async findByUserId(userId: string): Promise<StreamingAccount | null> {
    const query = `
      SELECT 
        id, user_id, provider, provider_user_id, 
        decrypt_token(access_token_encrypted, $2) as access_token,
        decrypt_token(refresh_token_encrypted, $2) as refresh_token,
        access_token_expires_at as expires_at,
        created_at, updated_at
      FROM streaming_accounts 
      WHERE user_id = $1
    `;
    const result = await this.pool.query(query, [userId, this.encryptionSecret]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async findByProviderAccountId(providerAccountId: string): Promise<StreamingAccount | null> {
    const query = `
      SELECT 
        id, user_id, provider, provider_user_id, 
        decrypt_token(access_token_encrypted, $2) as access_token,
        decrypt_token(refresh_token_encrypted, $2) as refresh_token,
        access_token_expires_at as expires_at,
        created_at, updated_at
      FROM streaming_accounts 
      WHERE provider_user_id = $1
    `;
    const result = await this.pool.query(query, [providerAccountId, this.encryptionSecret]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async save(account: StreamingAccount): Promise<StreamingAccount> {
    const query = `
      INSERT INTO streaming_accounts (
        id, user_id, provider, provider_user_id, 
        access_token_encrypted, refresh_token_encrypted, 
        access_token_expires_at, created_at, updated_at
      ) 
      VALUES (
        $1, $2, $3, $4, 
        encrypt_token($5, $10), encrypt_token($6, $10), 
        $7, $8, $9
      ) 
      ON CONFLICT (id) DO UPDATE SET 
        access_token_encrypted = EXCLUDED.access_token_encrypted, 
        refresh_token_encrypted = EXCLUDED.refresh_token_encrypted, 
        access_token_expires_at = EXCLUDED.access_token_expires_at,
        updated_at = EXCLUDED.updated_at 
      RETURNING 
        id, user_id, provider, provider_user_id, 
        decrypt_token(access_token_encrypted, $10) as access_token,
        decrypt_token(refresh_token_encrypted, $10) as refresh_token,
        access_token_expires_at as expires_at,
        created_at, updated_at;
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
      this.encryptionSecret,
    ]);
    return this.mapToEntity(result.rows[0]);
  }

  private mapToEntity(row: any): StreamingAccount {
    return new StreamingAccount(
      row.id,
      row.user_id,
      row.provider,
      row.provider_user_id,
      row.access_token,
      row.refresh_token,
      row.expires_at,
      row.created_at,
      row.updated_at,
    );
  }
}
