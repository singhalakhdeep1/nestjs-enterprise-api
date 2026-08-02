// EventStoreDB integration for nestjs-enterprise-api

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';

@Injectable()
export class EventStoreService implements OnModuleInit, OnModuleDestroy {
  private client: EventStoreDBClient;

  constructor() {
    this.client = new EventStoreDBClient({
      endpoint: 'localhost:2113',
    });
  }

  async onModuleInit() {
    try {
      await this.client.readAll({
        direction: 'forwards',
        maxCount: 10,
      });
      console.log('Connected to EventStoreDB');
    } catch (error) {
      console.error('Failed to connect to EventStoreDB:', error);
    }
  }

  onModuleDestroy() {
    this.client.dispose();
  }

  async appendEvent(streamName: string, eventType: string, data: any) {
    const event = jsonEvent({
      type: eventType,
      data: data,
    });

    return this.client.appendToStream(streamName, event);
  }

  async readStream(streamName: string) {
    const events = this.client.readStream(streamName, {
      direction: 'forwards',
      maxCount: 10,
    });

    const result = [];
    for await (const event of events) {
      result.push(event);
    }
    return result;
  }

  async subscribeToStream(streamName: string, callback: (event: any) => void) {
    const subscription = this.client.subscribeToStream(streamName, {
      direction: 'forwards',
      fromRevision: 'start',
    });

    for await (const event of subscription) {
      callback(event);
    }
  }

  async deleteStream(streamName: string) {
    return this.client.deleteStream(streamName);
  }

  async getStreamMetadata(streamName: string) {
    return this.client.getStreamMetadata(streamName);
  }

  async setStreamMetadata(streamName: string, metadata: any) {
    return this.client.setStreamMetadata(streamName, metadata);
  }
}
