/**
 * Rate Limiting Service for NestJS Enterprise API
 * Token bucket per key, stored in Redis and updated atomically with a Lua script.
 * Fails open without Redis (the global @nestjs/throttler limit still applies).
 */
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { createRedis } from '../cache/cache.service';

const LUA = `
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local cap = tonumber(ARGV[1]); local rate = tonumber(ARGV[2]); local now = tonumber(ARGV[3]); local req = tonumber(ARGV[4])
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now
tokens = math.min(cap, tokens + ((now - ts) / 1000) * rate)
local ok = 0
if tokens >= req then tokens = tokens - req; ok = 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 1000)
return {ok, math.floor(tokens)}
`;

@Injectable()
export class RateLimitingService implements OnModuleDestroy {
  private redis: Redis;
  private bucketCapacity = parseInt(process.env.RATE_LIMIT_BUCKET_CAPACITY || '100', 10);
  private refillRate = parseFloat(process.env.RATE_LIMIT_REFILL_RATE || '1');

  constructor() {
    this.redis = createRedis();
    this.redis.on('error', () => undefined);
  }

  async consume(key: string, tokens = 1): Promise<{ allowed: boolean; remaining: number }> {
    if (this.redis.status !== 'ready') return { allowed: true, remaining: this.bucketCapacity };
    try {
      const [ok, remaining] = (await this.redis.eval(LUA, 1, `rate_limit:${key}`, this.bucketCapacity, this.refillRate, Date.now(), tokens)) as [number, number];
      return { allowed: ok === 1, remaining };
    } catch {
      return { allowed: true, remaining: this.bucketCapacity };
    }
  }

  async isAllowed(key: string, tokensRequested = 1): Promise<boolean> {
    return (await this.consume(key, tokensRequested)).allowed;
  }

  async getRemainingTokens(key: string): Promise<number> {
    return (await this.consume(key, 0)).remaining;
  }

  async resetBucket(key: string): Promise<void> {
    if (this.redis.status === 'ready') await this.redis.del(`rate_limit:${key}`).catch(() => undefined);
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
