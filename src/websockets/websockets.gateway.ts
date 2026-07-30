import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebsocketsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'joinedRoom', data: room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    return { event: 'leftRoom', data: room };
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any) {
    this.server.to(payload.room).emit('message', {
      user: client.id,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
    return { event: 'messageSent', data: payload };
  }

  broadcastUserUpdate(user: any) {
    this.server.emit('userUpdate', user);
  }

  broadcastPostUpdate(post: any) {
    this.server.emit('postUpdate', post);
  }
}
