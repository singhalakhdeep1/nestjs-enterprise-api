// gRPC server for enterprise.proto (EnterpriseService), backed by the Entity table.
// Runs as a hybrid microservice next to HTTP on GRPC_URL (default 0.0.0.0:50051).
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import type { Entity as EntityRow, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface EntityMsg {
  id?: string;
  name?: string;
  type?: string;
  attributes?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

const toMsg = (e: EntityRow): EntityMsg => ({
  id: e.id,
  name: e.name,
  type: e.type,
  attributes: Object.fromEntries(Object.entries((e.attributes ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v)])),
  created_at: e.createdAt.toISOString(),
  updated_at: e.updatedAt.toISOString(),
});

@Controller()
export class EnterpriseGrpcController {
  constructor(private readonly prisma: PrismaService) {}

  @GrpcMethod('EnterpriseService', 'CreateEntity')
  async createEntity(data: EntityMsg): Promise<EntityMsg> {
    if (!data.name || !data.type) throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'name and type are required' });
    return toMsg(await this.prisma.entity.create({ data: { name: data.name, type: data.type, attributes: (data.attributes ?? {}) as Prisma.InputJsonValue } }));
  }

  @GrpcMethod('EnterpriseService', 'GetEntity')
  async getEntity({ id }: { id: string }): Promise<EntityMsg> {
    const e = await this.prisma.entity.findUnique({ where: { id } });
    if (!e) throw new RpcException({ code: status.NOT_FOUND, message: `entity ${id} not found` });
    return toMsg(e);
  }

  @GrpcMethod('EnterpriseService', 'UpdateEntity')
  async updateEntity(data: EntityMsg): Promise<EntityMsg> {
    if (!data.id) throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'id is required' });
    const existing = await this.prisma.entity.findUnique({ where: { id: data.id } });
    if (!existing) throw new RpcException({ code: status.NOT_FOUND, message: `entity ${data.id} not found` });
    return toMsg(
      await this.prisma.entity.update({
        where: { id: data.id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.type ? { type: data.type } : {}),
          ...(data.attributes && Object.keys(data.attributes).length ? { attributes: { ...(existing.attributes as object), ...data.attributes } } : {}),
        },
      }),
    );
  }

  @GrpcMethod('EnterpriseService', 'DeleteEntity')
  async deleteEntity({ id }: { id: string }) {
    const r = await this.prisma.entity.deleteMany({ where: { id } });
    return { success: r.count === 1, message: r.count === 1 ? `entity ${id} deleted` : `entity ${id} not found` };
  }

  /** Server-streaming (unary request, Observable response): every entity in id order. */
  @GrpcMethod('EnterpriseService', 'StreamEntities')
  streamEntities(_req: object): Observable<EntityMsg> {
    return new Observable<EntityMsg>((sub) => {
      let cancelled = false;
      (async () => {
        let cursor: string | undefined;
        while (!cancelled) {
          const batch = await this.prisma.entity.findMany({ take: 100, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), orderBy: { id: 'asc' } });
          batch.forEach((e) => sub.next(toMsg(e)));
          if (batch.length < 100) break;
          cursor = batch[batch.length - 1].id;
        }
        sub.complete();
      })().catch((err) => sub.error(err));
      return () => {
        cancelled = true;
      };
    });
  }
}
