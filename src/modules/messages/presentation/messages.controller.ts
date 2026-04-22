import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { MessagesRepository } from '../infrastructure/messages.repository';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Messages')
@ApiCookieAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly repo: MessagesRepository) {}

  @ApiOperation({ summary: 'Obtener mensajes de una conversación' })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de mensajes' })
  @ApiQuery({ name: 'skip', required: false, description: 'Mensajes a saltar' })
  @Get('conversations/:id/messages')
  async getMessages(@Param('id') conversationId: string, @Query('limit') limit?: string, @Query('skip') skip?: string) {
    const l = limit ? parseInt(limit, 10) : 50;
    const s = skip ? parseInt(skip, 10) : 0;
    const items = await this.repo.getMessagesByConversation(conversationId, l, s);
    return {
      items,
      nextCursor: items.length === l ? s + l : null,
    };
  }

  @ApiOperation({ summary: 'Marcar mensajes como leídos' })
  @ApiBody({ schema: { type: 'object', properties: { conversationId: { type: 'string' } } } })
  @Post('messages/read')
  async markRead(@Body() body: any, @Req() req: any) {
    const updatedCount = await this.repo.markAsRead(body.conversationId, req.user.userId);
    return { updatedCount };
  }
}
