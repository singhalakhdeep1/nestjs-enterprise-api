// Redis integration for nestjs-enterprise-api

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  async onModuleInit() {
    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  onModuleDestroy() {
    this.client.quit();
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      return this.client.setex(key, ttl, value);
    }
    return this.client.set(key, value);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async exists(key: string) {
    return this.client.exists(key);
  }

  async expire(key: string, seconds: number) {
    return this.client.expire(key, seconds);
  }

  async hset(key: string, field: string, value: string) {
    return this.client.hset(key, field, value);
  }

  async hget(key: string, field: string) {
    return this.client.hget(key, field);
  }

  async hgetall(key: string) {
    return this.client.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]) {
    return this.client.hdel(key, ...fields);
  }

  async lpush(key: string, ...values: string[]) {
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]) {
    return this.client.rpush(key, ...values);
  }

  async lrange(key: string, start: number, stop: number) {
    return this.client.lrange(key, start, stop);
  }

  async lpop(key: string) {
    return this.client.lpop(key);
  }

  async rpop(key: string) {
    return this.client.rpop(key);
  }

  async sadd(key: string, ...members: string[]) {
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]) {
    return this.client.srem(key, ...members);
  }

  async smembers(key: string) {
    return this.client.smembers(key);
  }

  async incr(key: string) {
    return this.client.incr(key);
  }

  async decr(key: string) {
    return this.client.decr(key);
  }

  async publish(channel: string, message: string) {
    return this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    const subscriber = this.client.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (chan, message) => {
      if (chan === channel) {
        callback(message);
      }
    });
  }
}
