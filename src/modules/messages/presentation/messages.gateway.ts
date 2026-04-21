import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, Inject } from '@nestjs/common';
import { MessagesRepository } from '../infrastructure/messages.repository';
import { Message } from '../domain/message.entity';
import { v4 as uuidv4 } from 'uuid';
@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(MessagesGateway.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesRepo: MessagesRepository,
  ) {}
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}. Waiting for AUTH message.`);
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    if (!data || !data.type) return;
    try {
      switch (data.type) {
        case 'AUTH':
          await this.handleAuth(client, data.token);
          break;
        case 'MESSAGE_SEND':
          await this.handleMessageSend(client, data.payload);
          break;
        default:
          break;
      }
    } catch (e: any) {
      this.logger.error(`Error handling WS message: ${e.message}`);
    }
  }
  private async handleAuth(client: Socket, token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;
      client.join(`user_room_${userId}`);
      client.emit('message', { type: 'AUTH_OK' });
      this.logger.log(`Client ${client.id} authenticated as ${userId}`);
    } catch (e) {
      client.emit('message', { type: 'AUTH_ERROR', message: 'Invalid token' });
      client.disconnect();
    }
  }
  private async handleMessageSend(client: Socket, payload: any) {
    const senderId = client.data.userId;
    if (!senderId) {
      client.emit('message', { type: 'AUTH_ERROR', message: 'Not authenticated' });
      return;
    }
    const { conversationId, toUserId, content, playbackEventId } = payload;
    const msg = new Message(
      uuidv4(),
      conversationId,
      senderId,
      toUserId,
      content,
      playbackEventId || null,
      false,
      null,
      new Date(),
    );
    await this.messagesRepo.save(msg);
    const emittedPayload = {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      createdAt: msg.createdAt,
    };
    client.emit('message', {
      type: 'MESSAGE_SENT',
      payload: emittedPayload,
    });
    this.server.to(`user_room_${toUserId}`).emit('message', {
      type: 'MESSAGE_RECEIVED',
      payload: emittedPayload,
    });
  }
}
