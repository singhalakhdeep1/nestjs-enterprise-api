// EventStoreDB integration: every CQRS domain event is appended to the stream `post-<id>` so a post's
// full history can be replayed (GET /posts/:id/history). Enabled by EVENTSTORE_CONNECTION_STRING.
import { Injectable, Logger } from '@nestjs/common';
import { EventStoreDBClient, jsonEvent, FORWARDS, START, StreamNotFoundError } from '@eventstore/db-client';

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);
  private client: EventStoreDBClient | null = process.env.EVENTSTORE_CONNECTION_STRING
    ? EventStoreDBClient.connectionString(process.env.EVENTSTORE_CONNECTION_STRING)
    : null;

  get enabled() {
    return this.client !== null;
  }

  async appendEvent(stream: string, type: string, data: Record<string, unknown>, metadata: Record<string, unknown> = {}) {
    if (!this.client) return null;
    try {
      return await this.client.appendToStream(stream, jsonEvent({ type, data: data as never, metadata: metadata as never }));
    } catch (err) {
      this.logger.error(`append ${type} to ${stream} failed: ${(err as Error).message}`);
      return null;
    }
  }

  async readStream(stream: string, maxCount = 200) {
    if (!this.client) throw new Error('EventStoreDB not configured');
    const events: { type: string; data: unknown; metadata: unknown; revision: string; created: Date }[] = [];
    try {
      for await (const resolved of this.client.readStream(stream, { direction: FORWARDS, fromRevision: START, maxCount })) {
        const e = resolved.event;
        if (e) events.push({ type: e.type, data: e.data, metadata: e.metadata, revision: String(e.revision), created: new Date(e.created) });
      }
    } catch (err) {
      if (err instanceof StreamNotFoundError) return [];
      throw err;
    }
    return events;
  }

  async subscribeToStream(stream: string, onEvent: (type: string, data: unknown) => void) {
    if (!this.client) return;
    const sub = this.client.subscribeToStream(stream);
    for await (const resolved of sub) if (resolved.event) onEvent(resolved.event.type, resolved.event.data);
  }

  async health(): Promise<string> {
    if (!this.client) return 'disabled';
    try {
      for await (const _ of this.client.readAll({ maxCount: 1 })) break;
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
