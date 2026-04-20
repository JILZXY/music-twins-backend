import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ConversationsService } from '../application/conversations.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}
  
  @Get()
  async getConversations(@Req() req: any) {
    return this.conversationsService.getConversations(req.user.userId);
  }
  
  @Post()
  async createConversation(@Body() body: any, @Req() req: any) {
    return this.conversationsService.createConversation(req.user.userId, body.targetUserId, body.originPlaybackEventId);
  }
}
