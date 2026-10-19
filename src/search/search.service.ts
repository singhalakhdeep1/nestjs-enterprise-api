import { Injectable, Logger } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { ElasticsearchService } from '../integrations/elasticsearch.service';

/**
 * Full-text search: Elasticsearch (multi_match with fuzziness, highlights, tag facets) when
 * ELASTICSEARCH_NODE is set; otherwise a case-insensitive PostgreSQL query.
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly postsService: PostsService, private readonly es: ElasticsearchService) {}

  async searchPosts(query: string, tag?: string, page = 1) {
    const q = query.trim();
    if (this.es.enabled) {
      try {
        return await this.es.search(q, { tag, from: (page - 1) * 20, size: 20 });
      } catch (err) {
        this.logger.warn(`Elasticsearch search failed, using database: ${(err as Error).message}`);
      }
    }
    const results = q ? await this.postsService.search(q, tag) : (await this.postsService.findAll({ tag, page })).data;
    return {
      engine: 'database',
      total: results.length,
      results: results.map((p) => ({ id: p.id, title: p.title, content: p.content, tags: p.tags.map((t) => t.name), authorId: p.authorId, authorName: p.author?.name, createdAt: p.createdAt })),
      tags: [],
    };
  }

  /** Rebuilds the Elasticsearch index from PostgreSQL. */
  async reindex() {
    if (!this.es.enabled) return { indexed: 0, engine: 'database' };
    await this.es.createIndex();
    const posts = await this.postsService.allForIndex();
    return this.es.bulkIndex(
      posts.map((p) => ({ id: p.id, title: p.title, content: p.content, tags: p.tags.map((t) => t.name), authorId: p.authorId, authorName: p.author?.name ?? '', published: p.published, createdAt: p.createdAt.toISOString() })),
    );
  }
}
