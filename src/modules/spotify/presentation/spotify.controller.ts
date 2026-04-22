import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SpotifyPlaybackService } from '../application/spotify-playback.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Spotify')
@ApiCookieAuth()
@Controller('spotify')
@UseGuards(JwtAuthGuard)
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyPlaybackService) {}

  @ApiOperation({ summary: 'Obtener la pista actual de Spotify' })
  @Get('now-playing')
  getNowPlaying(@Req() req: any) {
    return this.spotifyService.getNowPlaying(req.user.userId);
  }

  @ApiOperation({ summary: 'Obtener las pistas reproducidas recientemente' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de pistas (por defecto 20)' })
  @Get('recent')
  getRecent(@Req() req: any, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.spotifyService.getRecentlyPlayed(req.user.userId, parsedLimit);
  }
  @Get('top-tracks')
  getTopTracks(@Req() req: any, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.spotifyService.getTopTracks(req.user.userId, parsedLimit);
  }
}
