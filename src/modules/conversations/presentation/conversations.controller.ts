import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ConversationsService } from '../application/conversations.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Conversations')
@ApiCookieAuth()
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}
  
  @ApiOperation({ summary: 'Obtener conversaciones del usuario' })
  @Get()
  async getConversations(@Req() req: any) {
    return this.conversationsService.getConversations(req.user.userId);
  }
  
  @ApiOperation({ summary: 'Crear una nueva conversación' })
  @ApiBody({ schema: { type: 'object', properties: { targetUserId: { type: 'string' } } } })
  @Post()
  async createConversation(@Body() body: any, @Req() req: any) {
    return this.conversationsService.createConversation(req.user.userId, body.targetUserId);
  }
}
