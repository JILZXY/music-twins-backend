import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SpotifyPlaybackService } from '../application/spotify-playback.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import type { Request } from 'express';
@Controller('spotify')
@UseGuards(JwtAuthGuard)
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyPlaybackService) {}
  @Get('now-playing')
  getNowPlaying(@Req() req: any) {
    return this.spotifyService.getNowPlaying(req.user.userId);
  }
  @Get('recent')
  getRecent(@Req() req: any, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.spotifyService.getRecentlyPlayed(req.user.userId, parsedLimit);
  }
}
