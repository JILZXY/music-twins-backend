import { Module, Controller, Get, Query, Req, UseGuards, Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { PG_POOL } from '../database/database.module';

@Injectable()
export class FeedService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getFeed(userId: string, friendId?: string, limit: number = 20): Promise<any> {
    // Collects playback events for user and accepted friends.
    let filterCondition = `
      pe.user_id = $1 OR pe.user_id IN (
        SELECT CASE WHEN user_id = $1 THEN friend_id ELSE user_id END
        FROM friends
        WHERE (user_id = $1 OR friend_id = $1) AND status = 'ACCEPTED'
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
        pe.name AS "trackName",
        pe.artist AS "trackArtist",
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

    return {
      items: result.rows.map((row) => ({
        playbackEventId: row.playbackEventId,
        user: {
          id: row.userId,
          displayName: row.userDisplayName,
          avatarUrl: row.userAvatarUrl,
        },
        track: {
          trackId: row.trackId,
          name: row.trackName,
          artist: row.trackArtist,
          albumName: row.albumName,
          albumImageUrl: row.albumImageUrl,
        },
        playedAt: row.playedAt,
        reactions: row.reactions,
        notesCount: row.notesCount,
      })),
      nextCursor: null, // Logic for pagination/cursor can be added if needed
    };
  }
}

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getFeed(@Query('friendId') friendId: string, @Query('limit') limit: string, @Req() req: any) {
    const l = limit ? parseInt(limit, 10) : 20;
    return this.feedService.getFeed(req.user.userId, friendId, l);
  }
}

@Module({
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
