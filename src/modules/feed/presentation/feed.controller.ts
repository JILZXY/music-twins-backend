import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FeedService } from '../application/feed.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Feed')
@ApiCookieAuth()
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @ApiOperation({ summary: 'Obtener el feed de actividad' })
  @ApiQuery({
    name: 'friendId',
    required: false,
    description: 'ID del amigo para filtrar',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de resultados (por defecto 20)',
  })
  @Get()
  async getFeed(
    @Query('friendId') friendId: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    const l = limit ? parseInt(limit, 10) : 20;
    return this.feedService.getFeed(req.user.userId, friendId, l);
  }

  @Get('summary')
  async getFriendsSummary(@Req() req: any) {
    return this.feedService.getFriendsSummary(req.user.userId);
  }

  @Get('trending')
  async getTrendingTracks(@Req() req: any) {
    return this.feedService.getTrendingTracks(req.user.userId);
  }
}
