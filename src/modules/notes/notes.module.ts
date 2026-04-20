import { Module, Controller, Post, Get, Body, Param, Req, UseGuards, Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { PG_POOL } from '../../shared/infrastructure/database/postgres/postgres.module';
export class Note {
  constructor(
    public readonly id: string,
    public readonly playbackEventId: string,
    public readonly userId: string,
    public readonly content: string,
    public readonly createdAt: Date,
  ) {}
}
@Injectable()
export class NotesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async create(note: Note): Promise<Note> {
    const query = `
      INSERT INTO notes (id, playback_event_id, user_id, content, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await this.pool.query(query, [note.id, note.playbackEventId, note.userId, note.content, note.createdAt]);
    const r = res.rows[0];
    return new Note(r.id, r.playback_event_id, r.user_id, r.content, r.created_at);
  }
  async findByPlaybackEvent(eventId: string): Promise<any[]> {
    const query = `
      SELECT n.id, n.content, n.created_at as "createdAt", u.display_name as "displayName", u.avatar_url as "avatarUrl"
      FROM notes n
      JOIN users u ON u.id = n.user_id
      WHERE n.playback_event_id = $1
      ORDER BY n.created_at DESC
    `;
    const res = await this.pool.query(query, [eventId]);
    return res.rows;
  }
}
@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly repo: NotesRepository) {}
  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const n = new Note(uuidv4(), body.playbackEventId, req.user.userId, body.content, new Date());
    return this.repo.create(n);
  }
  @Get(':playbackEventId')
  async getByEvent(@Param('playbackEventId') id: string) {
    return this.repo.findByPlaybackEvent(id);
  }
}
@Module({
  controllers: [NotesController],
  providers: [NotesRepository],
  exports: [NotesRepository],
})
export class NotesModule {}
