import { Injectable } from '@nestjs/common';
import * as os from 'os';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache/cache.service';
import { ElasticsearchService } from '../integrations/elasticsearch.service';
import { RabbitMQService } from '../integrations/rabbitmq.service';
import { EventStoreService } from '../integrations/eventstore.service';
import { registry } from './metrics';

@Injectable()
export class MonitoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly es: ElasticsearchService,
    private readonly rabbit: RabbitMQService,
    private readonly eventStore: EventStoreService,
  ) {}

  async dependencies() {
    const database = await this.prisma.$queryRaw`SELECT 1`.then(() => 'connected').catch(() => 'disconnected');
    return { database, redis: this.cache.status(), elasticsearch: await this.es.health(), rabbitmq: this.rabbit.status(), eventstore: await this.eventStore.health() };
  }

  async getHealth() {
    const deps = await this.dependencies();
    const degraded = Object.entries(deps).some(([k, v]) => k !== 'database' && v === 'disconnected');
    return {
      status: deps.database !== 'connected' ? 'unhealthy' : degraded ? 'degraded' : 'healthy',
      dependencies: deps,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
    };
  }

  /** Prometheus exposition format. */
  getMetrics() {
    return registry.metrics();
  }

  async getStats() {
    const [users, posts, comments, tags] = await Promise.all([this.prisma.user.count(), this.prisma.post.count(), this.prisma.comment.count(), this.prisma.tag.count()]);
    return {
      counts: { users, posts, comments, tags },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      loadavg: os.loadavg(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
    };
  }

  async getAlerts() {
    const alerts: { level: string; type: string; message: string; value?: number }[] = [];
    const mem = process.memoryUsage();
    const memPercent = (mem.heapUsed / mem.heapTotal) * 100;
    if (memPercent > 90) alerts.push({ level: 'critical', type: 'memory', message: `Heap usage is ${memPercent.toFixed(1)}%`, value: memPercent });
    else if (memPercent > 75) alerts.push({ level: 'warning', type: 'memory', message: `Heap usage is ${memPercent.toFixed(1)}%`, value: memPercent });
    const load = os.loadavg()[0];
    if (load > os.cpus().length) alerts.push({ level: 'warning', type: 'cpu', message: `Load average is ${load.toFixed(2)}`, value: load });
    for (const [dep, s] of Object.entries(await this.dependencies())) {
      if (s === 'disconnected' || s === 'unhealthy') alerts.push({ level: dep === 'database' ? 'critical' : 'warning', type: 'dependency', message: `${dep} is ${s}` });
    }
    return { total: alerts.length, alerts };
  }
}
