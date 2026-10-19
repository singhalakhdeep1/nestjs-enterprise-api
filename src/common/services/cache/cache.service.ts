/**
 * Cache Service for NestJS Enterprise API
 * Distributed caching with Redis: get/set/delete, TTL, get-or-set, pattern invalidation.
 * Degrades to cache misses when Redis is unavailable.
 */
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

export function createRedis(): Redis {
  const opts = { maxRetriesPerRequest: 1, enableOfflineQueue: false, retryStrategy: (n: number) => Math.min(n * 500, 5000) };
  return process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, opts)
    : new Redis({ host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379', 10), ...opts });
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private defaultTTL = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);

  constructor() {
    this.redis = createRedis();
    this.redis.on('error', (e) => this.logger.debug(`redis: ${e.message}`));
  }

  get ready() {
    return this.redis.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    if (!this.ready) return null;
    return this.redis.get(key).catch(() => null);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.ready) return;
    await this.redis.setex(key, ttl || this.defaultTTL, value).catch(() => undefined);
  }

  async delete(key: string): Promise<void> {
    if (!this.ready) return;
    await this.redis.del(key).catch(() => undefined);
  }

  async getOrSet(key: string, factory: () => Promise<string>, ttl?: number): Promise<string> {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async getOrSetJson<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<{ value: T; cached: boolean }> {
    const cached = await this.get(key);
    if (cached !== null) return { value: JSON.parse(cached), cached: true };
    const value = await factory();
    if (value !== null && value !== undefined) await this.set(key, JSON.stringify(value), ttl);
    return { value, cached: false };
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.ready) return;
    try {
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch {
      // ignore
    }
  }

  status() {
    return this.ready ? 'connected' : 'disconnected';
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
