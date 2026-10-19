import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostsService } from '../../posts/posts.service';
import { CacheService } from '../../common/services/cache/cache.service';
import { RedisService } from '../../integrations/redis.service';

export class ListPostsQuery {
  constructor(public readonly opts: { page?: number; limit?: number; tag?: string; authorId?: string; viewerId?: string }) {}
}

export class GetPostQuery {
  constructor(public readonly id: string, public readonly viewerId?: string, public readonly countView = false) {}
}

/** Read side: cache-aside over Redis for the public feed; invalidated by the post event handlers. */
@QueryHandler(ListPostsQuery)
export class ListPostsHandler implements IQueryHandler<ListPostsQuery> {
  constructor(private readonly posts: PostsService, private readonly cache: CacheService) {}

  async execute({ opts }: ListPostsQuery) {
    if (opts.viewerId && opts.authorId === opts.viewerId) {
      return { ...(await this.posts.findAll({ ...opts, includeUnpublishedFor: opts.viewerId })), cached: false };
    }
    const key = `posts:list:${opts.page ?? 1}:${opts.limit ?? 20}:${opts.tag ?? ''}:${opts.authorId ?? ''}`;
    const { value, cached } = await this.cache.getOrSetJson(key, () => this.posts.findAll(opts), 60);
    return { ...value, cached };
  }
}

@QueryHandler(GetPostQuery)
export class GetPostHandler implements IQueryHandler<GetPostQuery> {
  constructor(private readonly posts: PostsService, private readonly cache: CacheService, private readonly redis: RedisService) {}

  async execute({ id, viewerId, countView }: GetPostQuery) {
    const { value: post, cached } = await this.cache.getOrSetJson(`posts:item:${id}`, () => this.posts.findOne(id), 120);
    if (!post || (!post.published && post.authorId !== viewerId)) throw new NotFoundException('Post not found');
    if (countView) {
      await this.posts.incrementViews(id);
      await this.redis.incr(`posts:views:${id}`);
    }
    return { ...post, cached };
  }
}

export const QueryHandlers = [ListPostsHandler, GetPostHandler];
