import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FriendsService } from '../application/friends.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  getFriends(@Req() req: any) {
    return this.friendsService.getFriends(req.user.userId);
  }

  @Get('requests')
  getRequests(@Req() req: any) {
    return this.friendsService.getPendingRequests(req.user.userId);
  }

  @Post('requests')
  sendRequest(@Body('targetUserId') targetUserId: string, @Req() req: any) {
    return this.friendsService.sendRequest(req.user.userId, targetUserId);
  }

  @Patch('requests/:id')
  respondToRequest(@Param('id') requestId: string, @Body('action') action: 'ACCEPT' | 'REJECT', @Req() req: any) {
    return this.friendsService.respondToRequest(req.user.userId, requestId, action);
  }
}
