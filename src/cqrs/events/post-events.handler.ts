import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CommentAddedEvent, CommentDeletedEvent, PostCreatedEvent, PostDeletedEvent, PostSnapshot, PostUpdatedEvent } from './post.events';
import { ElasticsearchService } from '../../integrations/elasticsearch.service';
import { RabbitMQService } from '../../integrations/rabbitmq.service';
import { EventStoreService } from '../../integrations/eventstore.service';
import { RedisService } from '../../integrations/redis.service';
import { CacheService } from '../../common/services/cache/cache.service';
import { StructuredLoggingService } from '../../common/services/structured-logging/structured-logging.service';

export const REALTIME_CHANNEL = 'realtime:posts';

type AnyPostEvent = PostCreatedEvent | PostUpdatedEvent | PostDeletedEvent | CommentAddedEvent | CommentDeletedEvent;

const toDoc = (p: PostSnapshot) => ({
  id: p.id,
  title: p.title,
  content: p.content,
  tags: p.tags.map((t) => t.name),
  authorId: p.authorId,
  authorName: p.author?.name ?? '',
  published: p.published,
  createdAt: new Date(p.createdAt).toISOString(),
});

/**
 * Write-side fan-out of domain events:
 *  - Elasticsearch: keep the search index in sync
 *  - RabbitMQ: publish `post.*` / `comment.*` for other services
 *  - EventStoreDB: append to stream `post-<id>` (event-sourced history)
 *  - Redis pub/sub: real-time push to websocket clients on every instance
 *  - Cache: invalidate read models
 */
@EventsHandler(PostCreatedEvent, PostUpdatedEvent, PostDeletedEvent, CommentAddedEvent, CommentDeletedEvent)
export class PostEventsHandler implements IEventHandler<AnyPostEvent> {
  private readonly logger = new Logger(PostEventsHandler.name);

  constructor(
    private readonly es: ElasticsearchService,
    private readonly rabbit: RabbitMQService,
    private readonly eventStore: EventStoreService,
    private readonly redis: RedisService,
    private readonly cache: CacheService,
    private readonly logging: StructuredLoggingService,
  ) {}

  async handle(event: AnyPostEvent) {
    const { name, postId, payload, actor } = this.describe(event);
    try {
      await this.cache.invalidatePattern('posts:list:*');
      await this.cache.delete(`posts:item:${postId}`);
      if (event instanceof PostCreatedEvent || event instanceof PostUpdatedEvent) await this.es.indexPost(toDoc(event.post));
      if (event instanceof PostDeletedEvent) await this.es.deletePost(postId);
    } catch (err) {
      this.logger.error(`search/cache sync failed for ${name}: ${(err as Error).message}`);
    }
    await Promise.all([
      this.rabbit.publish(name, payload),
      this.eventStore.appendEvent(`post-${postId}`, name, payload, { actor, correlationId: this.logging.getContext()?.correlationId }),
      this.redis.publish(REALTIME_CHANNEL, { event: name, postId, data: payload }),
    ]);
    this.logging.logAuditEvent(name, `${name} ${postId}`, { actor, postId });
  }

  private describe(event: AnyPostEvent) {
    if (event instanceof PostCreatedEvent) return { name: 'post.created', postId: event.post.id, actor: event.actorId, payload: toDoc(event.post) };
    if (event instanceof PostUpdatedEvent) return { name: 'post.updated', postId: event.post.id, actor: event.actorId, payload: { ...toDoc(event.post), changes: event.changes } };
    if (event instanceof PostDeletedEvent) return { name: 'post.deleted', postId: event.postId, actor: event.actorId, payload: { id: event.postId, title: event.title } };
    if (event instanceof CommentAddedEvent) {
      const c = event.comment;
      return { name: 'comment.added', postId: event.postId, actor: c.authorId, payload: { id: c.id, postId: event.postId, content: c.content, authorId: c.authorId, authorName: c.author?.name ?? '', createdAt: new Date(c.createdAt).toISOString() } };
    }
    return { name: 'comment.deleted', postId: event.postId, actor: event.actorId, payload: { id: event.commentId, postId: event.postId } };
  }
}
