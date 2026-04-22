import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FriendsService } from '../application/friends.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Friends')
@ApiCookieAuth()
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @ApiOperation({ summary: 'Obtener lista de amigos' })
  @Get()
  getFriends(@Req() req: any) {
    return this.friendsService.getFriends(req.user.userId);
  }

  @ApiOperation({ summary: 'Obtener solicitudes de amistad pendientes' })
  @Get('requests')
  getRequests(@Req() req: any) {
    return this.friendsService.getPendingRequests(req.user.userId);
  }

  @ApiOperation({ summary: 'Enviar solicitud de amistad' })
  @ApiBody({ schema: { type: 'object', properties: { targetUserId: { type: 'string' } } } })
  @Post('requests')
  sendRequest(@Body('targetUserId') targetUserId: string, @Req() req: any) {
    return this.friendsService.sendRequest(req.user.userId, targetUserId);
  }

  @ApiOperation({ summary: 'Responder a una solicitud de amistad' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud' })
  @ApiBody({ schema: { type: 'object', properties: { action: { type: 'string', enum: ['ACCEPT', 'REJECT'] } } } })
  @Patch('requests/:id')
  respondToRequest(@Param('id') requestId: string, @Body('action') action: 'ACCEPT' | 'REJECT', @Req() req: any) {
    return this.friendsService.respondToRequest(req.user.userId, requestId, action);
  }
}
