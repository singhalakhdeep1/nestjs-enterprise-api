import {
  WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { RedisService } from '../integrations/redis.service';
import { REALTIME_CHANNEL } from '../cqrs/events/post-events.handler';
import { wsConnections } from '../monitoring/metrics';

/**
 * Real-time updates over socket.io. Post/comment events arrive through Redis pub/sub (so every API
 * instance pushes them) and are emitted to everyone (`postUpdate`) and to the post's room (`post:<id>`).
 * Chat-style room messages require a JWT (`auth.token` in the handshake).
 */
@WebSocketGateway({ cors: { origin: (process.env.CORS_ORIGIN || 'http://localhost:3103').split(',') } })
export class WebsocketsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebsocketsGateway');

  constructor(private readonly jwt: JwtService, private readonly redis: RedisService) {}

  afterInit() {
    void this.redis.subscribe(REALTIME_CHANNEL, (msg) => {
      const m = msg as { event: string; postId: string; data: unknown };
      this.server.emit('postUpdate', m);
      this.server.to(`post:${m.postId}`).emit(m.event, m.data);
    });
  }

  handleConnection(client: Socket) {
    const token = (client.handshake.auth?.token as string) || client.handshake.headers.authorization?.replace(/^Bearer /, '');
    if (token) {
      try {
        const payload = this.jwt.verify<{ sub: string; email: string }>(token);
        client.data.user = { id: payload.sub, email: payload.email };
      } catch {
        client.emit('error', { message: 'Invalid token' });
      }
    }
    wsConnections.inc();
    this.logger.log(`Client connected: ${client.id}${client.data.user ? ` (${client.data.user.email})` : ''}`);
  }

  handleDisconnect(client: Socket) {
    wsConnections.dec();
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    if (typeof room !== 'string' || room.length > 100) return { event: 'error', data: 'invalid room' };
    client.join(room);
    return { event: 'joinedRoom', data: room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    client.leave(room);
    return { event: 'leftRoom', data: room };
  }

  @SubscribeMessage('message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { room: string; message: string }) {
    if (!client.data.user) return { event: 'error', data: 'authentication required' };
    if (!payload?.room || typeof payload.message !== 'string' || payload.message.length > 2000) return { event: 'error', data: 'invalid message' };
    this.server.to(payload.room).emit('message', { user: client.data.user.email, message: payload.message, timestamp: new Date().toISOString() });
    return { event: 'messageSent', data: payload };
  }

  broadcastUserUpdate(user: unknown) {
    this.server.emit('userUpdate', user);
  }

  broadcastPostUpdate(post: unknown) {
    this.server.emit('postUpdate', post);
  }
}
