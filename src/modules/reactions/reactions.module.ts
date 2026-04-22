import { Module, Controller, Post, Get, Body, Param, Req, UseGuards, Injectable, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { PG_POOL } from '../../shared/infrastructure/database/postgres/postgres.module';
export class Reaction {
  constructor(
    public readonly id: string,
    public readonly playbackEventId: string,
    public readonly userId: string,
    public readonly emoji: string,
    public readonly createdAt: Date,
  ) {}
}
@Injectable()
export class ReactionsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async create(reaction: Reaction): Promise<Reaction> {
    const query = `
      INSERT INTO reactions (id, playback_event_id, user_id, emoji, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (playback_event_id, user_id, emoji) DO NOTHING
      RETURNING *;
    `;
    const res = await this.pool.query(query, [reaction.id, reaction.playbackEventId, reaction.userId, reaction.emoji, reaction.createdAt]);
    if (res.rows.length === 0) return reaction; 
    const r = res.rows[0];
    return new Reaction(r.id, r.playback_event_id, r.user_id, r.emoji, r.created_at);
  }
  async findByPlaybackEvent(eventId: string): Promise<any[]> {
    const query = `SELECT emoji, COUNT(*) as count FROM reactions WHERE playback_event_id = $1 GROUP BY emoji`;
    const res = await this.pool.query(query, [eventId]);
    return res.rows;
  }
}
@ApiTags('Reactions')
@ApiCookieAuth()
@Controller('reactions')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private readonly repo: ReactionsRepository) {}
  @ApiOperation({ summary: 'Crear una reacción a un evento de reproducción' })
  @ApiBody({ schema: { type: 'object', properties: { playbackEventId: { type: 'string' }, emoji: { type: 'string' } } } })
  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const r = new Reaction(uuidv4(), body.playbackEventId, req.user.userId, body.emoji, new Date());
    return this.repo.create(r);
  }
  @ApiOperation({ summary: 'Obtener reacciones por ID de evento de reproducción' })
  @ApiParam({ name: 'playbackEventId', description: 'ID del evento de reproducción' })
  @Get(':playbackEventId')
  async getByEvent(@Param('playbackEventId') id: string) {
    return this.repo.findByPlaybackEvent(id);
  }
}
@Module({
  controllers: [ReactionsController],
  providers: [ReactionsRepository],
  exports: [ReactionsRepository],
})
export class ReactionsModule {}
