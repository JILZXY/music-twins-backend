import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FeedService } from '../application/feed.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import type { Request } from 'express';

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
