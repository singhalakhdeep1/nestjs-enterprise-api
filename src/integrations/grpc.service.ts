// gRPC integration for nestjs-enterprise-api

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';

@Injectable()
export class GrpcService implements OnModuleInit, OnModuleDestroy {
  private client: ClientGrpc;

  constructor() {
    this.client = Client({
      package: 'enterprise',
      protoPath: './src/integrations/proto/enterprise.proto',
      options: {
        urls: ['localhost:50051'],
        package: 'enterprise',
      },
    });
  }

  onModuleInit() {
    this.client.getClientByService('EnterpriseService', 'enterprise');
  }

  onModuleDestroy() {
    this.client.close();
  }

  getEnterpriseService() {
    return this.client.getService<any>('EnterpriseService');
  }

  async createEntity(data: any) {
    const service = this.getEnterpriseService();
    return service.createEntity(data).toPromise();
  }

  async getEntity(id: string) {
    const service = this.getEnterpriseService();
    return service.getEntity({ id }).toPromise();
  }

  async updateEntity(id: string, data: any) {
    const service = this.getEnterpriseService();
    return service.updateEntity({ id, ...data }).toPromise();
  }

  async deleteEntity(id: string) {
    const service = this.getEnterpriseService();
    return service.deleteEntity({ id }).toPromise();
  }

  async streamEntities() {
    const service = this.getEnterpriseService();
    return service.streamEntities({});
  }
}
