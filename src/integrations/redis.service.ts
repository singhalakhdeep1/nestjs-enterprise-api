// Redis integration (ioredis): key/value, hash, list, set and counter helpers plus pub/sub. The app uses
// pub/sub to fan out real-time events to every API instance (websocket gateway) and counters for post views.
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { createRedis } from '../common/services/cache/cache.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis = createRedis();
  private subscriber: Redis | null = null;
  private handlers = new Map<string, ((message: unknown) => void)[]>();

  constructor() {
    this.client.on('error', () => undefined);
  }

  get ready() {
    return this.client.status === 'ready';
  }

  async get(key: string) {
    return this.ready ? this.client.get(key) : null;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (!this.ready) return;
    if (ttlSeconds) await this.client.setex(key, ttlSeconds, value);
    else await this.client.set(key, value);
  }

  async del(key: string) {
    if (this.ready) await this.client.del(key);
  }

  async hset(key: string, field: string, value: string) {
    if (this.ready) await this.client.hset(key, field, value);
  }

  async hgetall(key: string) {
    return this.ready ? this.client.hgetall(key) : {};
  }

  async lpush(key: string, ...values: string[]) {
    if (this.ready) await this.client.lpush(key, ...values);
  }

  async lrange(key: string, start = 0, stop = -1) {
    return this.ready ? this.client.lrange(key, start, stop) : [];
  }

  async sadd(key: string, ...members: string[]) {
    if (this.ready) await this.client.sadd(key, ...members);
  }

  async smembers(key: string) {
    return this.ready ? this.client.smembers(key) : [];
  }

  async incr(key: string): Promise<number | null> {
    return this.ready ? this.client.incr(key) : null;
  }

  async publish(channel: string, message: unknown) {
    if (this.ready) await this.client.publish(channel, JSON.stringify(message));
    else this.handlers.get(channel)?.forEach((h) => h(message)); // single-instance fallback
  }

  /** Subscribes on a dedicated connection (required by Redis while in subscribe mode). */
  async subscribe(channel: string, handler: (message: unknown) => void) {
    this.handlers.set(channel, [...(this.handlers.get(channel) ?? []), handler]);
    if (!this.subscriber) {
      // The subscriber may subscribe before it is connected, so it queues commands until ready.
      this.subscriber = this.client.duplicate({ enableOfflineQueue: true, maxRetriesPerRequest: null });
      this.subscriber.on('error', () => undefined);
      this.subscriber.on('message', (ch, raw) => {
        let msg: unknown = raw;
        try {
          msg = JSON.parse(raw);
        } catch {
          // plain string
        }
        this.handlers.get(ch)?.forEach((h) => h(msg));
      });
    }
    await this.subscriber.subscribe(channel).catch((e) => this.logger.debug(`subscribe failed: ${e.message}`));
  }

  status() {
    return this.ready ? 'connected' : 'disconnected';
  }

  onModuleDestroy() {
    this.subscriber?.disconnect();
    this.client.disconnect();
  }
}
