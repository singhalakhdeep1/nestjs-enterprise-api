// RabbitMQ integration (amqp-connection-manager): topic exchange for domain events with automatic
// reconnects, a durable consumer queue for notifications, publisher confirms. Enabled by RABBITMQ_URL.
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, type AmqpConnectionManager, type ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';

export const EVENTS_EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'enterprise.events';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;
  private handlers: { queue: string; pattern: string; handler: (routingKey: string, payload: unknown) => Promise<void> | void }[] = [];

  get enabled() {
    return Boolean(process.env.RABBITMQ_URL);
  }

  onModuleInit() {
    if (!this.enabled) return;
    this.connection = connect([process.env.RABBITMQ_URL!]);
    this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
    this.connection.on('disconnect', ({ err }) => this.logger.warn(`RabbitMQ disconnected: ${err?.message}`));
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (ch: ConfirmChannel) => {
        await ch.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
        for (const h of this.handlers) await this.bind(ch, h);
      },
    });
  }

  private async bind(ch: ConfirmChannel, h: (typeof this.handlers)[number]) {
    await ch.assertQueue(h.queue, { durable: true });
    await ch.bindQueue(h.queue, EVENTS_EXCHANGE, h.pattern);
    await ch.consume(h.queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      try {
        await h.handler(msg.fields.routingKey, JSON.parse(msg.content.toString()));
        ch.ack(msg);
      } catch (err) {
        this.logger.error(`consumer ${h.queue} failed: ${(err as Error).message}`);
        ch.nack(msg, false, !msg.fields.redelivered);
      }
    });
  }

  /** Publishes a domain event (routing key = event name, e.g. post.created). */
  async publish(routingKey: string, payload: unknown): Promise<boolean> {
    if (!this.channel) return false;
    try {
      await this.channel.publish(EVENTS_EXCHANGE, routingKey, { ...(payload as object), occurredAt: new Date().toISOString() }, { persistent: true, contentType: 'application/json' });
      return true;
    } catch (err) {
      this.logger.error(`publish ${routingKey} failed: ${(err as Error).message}`);
      return false;
    }
  }

  async subscribe(queue: string, pattern: string, handler: (routingKey: string, payload: unknown) => Promise<void> | void) {
    const h = { queue, pattern, handler };
    this.handlers.push(h);
    if (this.channel) await this.channel.addSetup((ch: ConfirmChannel) => this.bind(ch, h));
  }

  status() {
    if (!this.enabled) return 'disabled';
    return this.connection?.isConnected() ? 'connected' : 'disconnected';
  }

  async onModuleDestroy() {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
