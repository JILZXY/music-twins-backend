import { Controller, Post, Body, Req, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { PlaybackEvent } from '../domain/playback-event.entity';
import { PLAYBACK_REPOSITORY } from '../infrastructure/postgres-playback.repository';
import type { PlaybackRepository } from '../infrastructure/postgres-playback.repository';
import { v4 as uuidv4 } from 'uuid';
@Controller('playback')
@UseGuards(JwtAuthGuard)
export class PlaybackController {
  constructor(@Inject(PLAYBACK_REPOSITORY) private readonly playbackRepository: PlaybackRepository) {}
  @Post('sync')
  async sync(@Body() body: any, @Req() req: any) {
    const event = new PlaybackEvent(
      uuidv4(),
      req.user.userId,
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
