import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../shared/infrastructure/database/postgres/postgres.module';
import { FeedRepository } from '../domain/feed.repository';
import { FeedItem, FeedUser, FeedTrack } from '../domain/feed-item.entity';

@Injectable()
export class PostgresFeedRepository implements FeedRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  
  async getFeedItems(userId: string, friendId?: string, limit: number = 20): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
    let filterCondition = `
      pe.user_id = $1 OR pe.user_id IN (
        SELECT CASE WHEN user_id = $1 THEN friend_user_id ELSE user_id END
        FROM friends
        WHERE (user_id = $1 OR friend_user_id = $1) AND status = 'ACCEPTED'
      )
    `;
    const params: any[] = [userId, limit];
    if (friendId) {
      filterCondition = `pe.user_id = $3`;
      params.push(friendId);
    }
    const query = `
      SELECT 
        pe.id AS "playbackEventId",
        pe.track_id AS "trackId",
        pe.track_name AS "trackName",
        pe.artist_name AS "trackArtist",
        pe.album_name AS "albumName",
        pe.album_image_url AS "albumImageUrl",
        pe.played_at AS "playedAt",
        u.id AS "userId",
        u.display_name AS "userDisplayName",
        u.avatar_url AS "userAvatarUrl",
        COALESCE(r_agg.reactions, '[]'::json) AS "reactions",
        COALESCE(n_agg.notesCount, 0) AS "notesCount"
      FROM playback_events pe
      JOIN users u ON u.id = pe.user_id
      LEFT JOIN (
        SELECT playback_event_id, json_agg(json_build_object('emoji', emoji, 'count', total_count)) as reactions
        FROM (
          SELECT playback_event_id, emoji, COUNT(*) as total_count
          FROM reactions
          GROUP BY playback_event_id, emoji
        ) sub
        GROUP BY playback_event_id
      ) r_agg ON r_agg.playback_event_id = pe.id
      LEFT JOIN (
        SELECT playback_event_id, COUNT(*) as notesCount
        FROM notes
        GROUP BY playback_event_id
      ) n_agg ON n_agg.playback_event_id = pe.id
      WHERE ${filterCondition}
      ORDER BY pe.played_at DESC
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, params);
    
    const mappedItems = result.rows.map(row => {
      const user = new FeedUser(row.userId, row.userDisplayName, row.userAvatarUrl);
      const track = new FeedTrack(row.trackId, row.trackName, row.trackArtist, row.albumName, row.albumImageUrl);
      return new FeedItem(row.playbackEventId, user, track, row.playedAt, row.reactions, parseInt(row.notesCount, 10));
    });
    
    return {
      items: mappedItems,
      nextCursor: null,
    };
  }
}
