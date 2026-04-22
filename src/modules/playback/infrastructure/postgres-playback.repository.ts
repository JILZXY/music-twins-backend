import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PlaybackEvent } from '../domain/playback-event.entity';
import { PG_POOL } from '../../../shared/infrastructure/database/postgres/postgres.module';
export const PLAYBACK_REPOSITORY = 'PLAYBACK_REPOSITORY';
export interface PlaybackRepository {
  save(event: PlaybackEvent): Promise<PlaybackEvent>;
  getLatestForUser(userId: string): Promise<PlaybackEvent | null>;
}
@Injectable()
export class PostgresPlaybackRepository implements PlaybackRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  
  async getLatestForUser(userId: string): Promise<PlaybackEvent | null> {
    const query = `
      SELECT * FROM playback_events 
      WHERE user_id = $1 
      ORDER BY played_at DESC 
      LIMIT 1;
    `;
    const result = await this.pool.query(query, [userId]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return new PlaybackEvent(
      r.id,
      r.user_id,
      r.track_id,
      r.track_name,
      r.artist_name,
      r.album_name,
      r.album_image_url,
      r.played_at,
    );
  }

  async save(event: PlaybackEvent): Promise<PlaybackEvent> {
    const query = `
      INSERT INTO playback_events (id, user_id, track_id, track_name, artist_name, album_name, album_image_url, played_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
    `;
    const result = await this.pool.query(query, [
      event.id,
      event.userId,
      event.trackId,
      event.name,
      event.artist,
      event.albumName,
      event.albumImageUrl,
      event.playedAt,
    ]);
    if (result.rows.length === 0) return event;
    const r = result.rows[0];
    return new PlaybackEvent(
      r.id,
      r.user_id,
      r.track_id,
      r.track_name,
      r.artist_name,
      r.album_name,
      r.album_image_url,
      r.played_at,
    );
  }
}
