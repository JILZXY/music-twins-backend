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
import { MessagesRepository, Message } from '../messages.module';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  // A basic mapping from socket.id -> userId could be useful if not putting clients strictly in rooms
  // But putting clients in a room with their userId makes emitting to specific users trivial.

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

  // The client must emit a message like { event: 'messages', data: { type: 'AUTH', token: '...' } }
  // Due to normal Socket.IO behavior, we will listen on a single 'message' or 'events' channel, or standard distinct events.
  // The document says: "Cliente envía { type: 'AUTH', token: 'jwt' }" standard JSON.
  // In Socket.IO that is typically emitted as: socket.send({type: 'AUTH', ...}) which triggers 'message'
  // Or socket.emit('music_twins_event', {type: 'AUTH'...}). We will listen generically.

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
      // Join a room specifically for this user to receive messages
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
    
    // 1. Create message entity and store in Mongo (via Repo)
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

    // Normally we should refactor `messagesRepo` out if it accesses direct properties, wait, we must add a save method.
    // I will add a save method to MessagesRepository dynamically below.
    await this.messagesRepo.save(msg);

    const emittedPayload = {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      createdAt: msg.createdAt,
    };

    // 2. Acknowledge back to sender
    client.emit('message', {
      type: 'MESSAGE_SENT',
      payload: emittedPayload,
    });

    // 3. Emitt to receiver if they're connected (in their room)
    this.server.to(`user_room_${toUserId}`).emit('message', {
      type: 'MESSAGE_RECEIVED',
      payload: emittedPayload,
    });
  }
}
