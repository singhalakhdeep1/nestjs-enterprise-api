// gRPC client for EnterpriseService (enterprise.proto). Points at GRPC_CLIENT_URL (defaults to this app's
// own server) and backs the REST bridge at /integrations/grpc/entities.
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientGrpcProxy, Transport } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom, Observable, toArray } from 'rxjs';
import { join } from 'path';

export const PROTO_PATH = join(__dirname, 'proto', 'enterprise.proto');

interface EnterpriseClient {
  createEntity(data: unknown): Observable<unknown>;
  getEntity(data: { id: string }): Observable<unknown>;
  updateEntity(data: unknown): Observable<unknown>;
  deleteEntity(data: { id: string }): Observable<unknown>;
  streamEntities(data: object): Observable<unknown>;
}

@Injectable()
export class GrpcService implements OnModuleInit, OnModuleDestroy {
  private client: ClientGrpc;
  private service: EnterpriseClient;

  constructor() {
    this.client = new ClientGrpcProxy({
      package: 'enterprise',
      protoPath: PROTO_PATH,
      url: process.env.GRPC_CLIENT_URL || `localhost:${(process.env.GRPC_URL || '0.0.0.0:50051').split(':').pop()}`,
    }) as unknown as ClientGrpc;
  }

  onModuleInit() {
    this.service = this.client.getService<EnterpriseClient>('EnterpriseService');
  }

  onModuleDestroy() {
    (this.client as unknown as ClientGrpcProxy).close();
  }

  createEntity(data: { name: string; type: string; attributes?: Record<string, string> }) {
    return firstValueFrom(this.service.createEntity(data));
  }

  getEntity(id: string) {
    return firstValueFrom(this.service.getEntity({ id }));
  }

  updateEntity(id: string, data: { name?: string; type?: string; attributes?: Record<string, string> }) {
    return firstValueFrom(this.service.updateEntity({ id, ...data }));
  }

  deleteEntity(id: string) {
    return firstValueFrom(this.service.deleteEntity({ id }));
  }

  streamEntities() {
    return lastValueFrom(this.service.streamEntities({}).pipe(toArray()));
  }
}

export const grpcServerOptions = () => ({
  transport: Transport.GRPC as const,
  options: { package: 'enterprise', protoPath: PROTO_PATH, url: process.env.GRPC_URL || '0.0.0.0:50051' },
});
