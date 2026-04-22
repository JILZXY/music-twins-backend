import { Controller, Post, Body, Req, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { PlaybackEvent } from '../domain/playback-event.entity';
import { PLAYBACK_REPOSITORY } from '../infrastructure/postgres-playback.repository';
import type { PlaybackRepository } from '../infrastructure/postgres-playback.repository';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Playback')
@ApiCookieAuth()
@Controller('playback')
@UseGuards(JwtAuthGuard)
export class PlaybackController {
  constructor(
    @Inject(PLAYBACK_REPOSITORY)
    private readonly playbackRepository: PlaybackRepository,
  ) {}

  @ApiOperation({ summary: 'Sincronizar evento de reproducción' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        trackId: { type: 'string' },
        name: { type: 'string' },
        artist: { type: 'string' },
        albumName: { type: 'string' },
        albumImageUrl: { type: 'string' },
      },
    },
  })
  @Post('sync')
  async sync(@Body() body: any, @Req() req: any) {
    const userId = req.user.userId;
    const latestEvent = await this.playbackRepository.getLatestForUser(userId);
    
    // Normalizar IDs para comparación (quitar prefijo spotify:track: si existe)
    const normalizeId = (id: string) => id?.includes(':') ? id.split(':').pop() : id;
    const incomingId = normalizeId(body.trackId);
    const existingId = latestEvent ? normalizeId(latestEvent.trackId) : null;

    console.log(`[PlaybackSync] Usuario: ${userId} - Comparando: ${existingId} vs ${incomingId}`);

    if (existingId === incomingId) {
      return latestEvent;
    }

    const event = new PlaybackEvent(
      uuidv4(),
      userId,
      body.trackId,
      body.name,
      body.artist,
      body.albumName || null,
      body.albumImageUrl || null,
      new Date(),
    );
    return this.playbackRepository.save(event);
  }
}
