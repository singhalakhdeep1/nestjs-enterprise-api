// RabbitMQ integration for nestjs-enterprise-api

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, connect, AmqpConnectionManager } from 'amqp-connection-manager';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: AmqpConnectionManager;
  private channel: any;

  constructor() {
    this.connection = connect(['amqp://localhost']);
  }

  async onModuleInit() {
    this.channel = await this.connection.createChannel({
      json: true,
    });
    console.log('Connected to RabbitMQ');
  }

  onModuleDestroy() {
    this.connection.close();
  }

  async publishToQueue(queueName: string, message: any) {
    await this.channel.assertQueue(queueName, { durable: true });
    return this.channel.sendToQueue(queueName, message);
  }

  async publishToExchange(exchangeName: string, routingKey: string, message: any) {
    await this.channel.assertExchange(exchangeName, 'topic', { durable: true });
    return this.channel.publish(exchangeName, routingKey, message);
  }

  async consumeFromQueue(queueName: string, callback: (message: any) => void) {
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.consume(queueName, (msg: any) => {
      callback(msg.content);
      this.channel.ack(msg);
    });
  }

  async bindQueueToExchange(queueName: string, exchangeName: string, routingKey: string) {
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.assertExchange(exchangeName, 'topic', { durable: true });
    return this.channel.bindQueue(queueName, exchangeName, routingKey);
  }

  async createFanoutExchange(exchangeName: string) {
    return this.channel.assertExchange(exchangeName, 'fanout', { durable: true });
  }

  async createDirectExchange(exchangeName: string) {
    return this.channel.assertExchange(exchangeName, 'direct', { durable: true });
  }

  async createTopicExchange(exchangeName: string) {
    return this.channel.assertExchange(exchangeName, 'topic', { durable: true });
  }
}
