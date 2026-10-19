// Elasticsearch integration: posts index (create/update/delete/bulk), multi-match search with highlights,
// tag aggregations and health. Enabled by ELASTICSEARCH_NODE.
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

export interface PostDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  authorName: string;
  published: boolean;
  createdAt: string;
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client | null = null;
  readonly index = process.env.ELASTICSEARCH_INDEX || 'posts';

  constructor() {
    if (process.env.ELASTICSEARCH_NODE) {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_NODE,
        auth: process.env.ELASTICSEARCH_USERNAME ? { username: process.env.ELASTICSEARCH_USERNAME, password: process.env.ELASTICSEARCH_PASSWORD || '' } : undefined,
      });
    }
  }

  get enabled() {
    return this.client !== null;
  }

  async onModuleInit() {
    if (!this.client) return;
    try {
      await this.createIndex();
    } catch (err) {
      this.logger.warn(`Elasticsearch unavailable: ${(err as Error).message}`);
    }
  }

  async createIndex() {
    if (!this.client || (await this.client.indices.exists({ index: this.index }))) return;
    await this.client.indices.create({
      index: this.index,
      mappings: {
        properties: {
          title: { type: 'text', analyzer: 'english', fields: { raw: { type: 'keyword' } } },
          content: { type: 'text', analyzer: 'english' },
          tags: { type: 'keyword' },
          authorId: { type: 'keyword' },
          authorName: { type: 'text' },
          published: { type: 'boolean' },
          createdAt: { type: 'date' },
        },
      },
    });
  }

  async indexPost(doc: PostDocument) {
    if (!this.client) return;
    await this.client.index({ index: this.index, id: doc.id, document: doc, refresh: 'wait_for' });
  }

  async deletePost(id: string) {
    if (!this.client) return;
    await this.client.delete({ index: this.index, id, refresh: 'wait_for' }).catch((e) => {
      if (e?.meta?.statusCode !== 404) throw e;
    });
  }

  async bulkIndex(docs: PostDocument[]) {
    if (!this.client || docs.length === 0) return { indexed: 0, errors: false };
    const res = await this.client.bulk({ refresh: true, operations: docs.flatMap((d) => [{ index: { _index: this.index, _id: d.id } }, d]) });
    return { indexed: docs.length, errors: res.errors };
  }

  async search(query: string, opts: { tag?: string; from?: number; size?: number } = {}) {
    if (!this.client) throw new Error('Elasticsearch not configured');
    const res = await this.client.search<PostDocument>({
      index: this.index,
      from: opts.from ?? 0,
      size: opts.size ?? 20,
      query: {
        bool: {
          must: query ? [{ multi_match: { query, fields: ['title^3', 'content', 'tags^2', 'authorName'], fuzziness: 'AUTO' } }] : [{ match_all: {} }],
          filter: [{ term: { published: true } }, ...(opts.tag ? [{ term: { tags: opts.tag } }] : [])],
        },
      },
      highlight: { fields: { title: {}, content: { fragment_size: 120, number_of_fragments: 2 } } },
      aggs: { tags: { terms: { field: 'tags', size: 20 } } },
    });
    const total = typeof res.hits.total === 'number' ? res.hits.total : res.hits.total?.value ?? 0;
    return {
      engine: 'elasticsearch',
      total,
      results: res.hits.hits.map((h) => ({ ...h._source!, score: h._score, highlight: h.highlight })),
      tags: ((res.aggregations?.tags as { buckets: { key: string; doc_count: number }[] })?.buckets ?? []).map((b) => ({ tag: b.key, count: b.doc_count })),
    };
  }

  async health(): Promise<string> {
    if (!this.client) return 'disabled';
    try {
      const h = await this.client.cluster.health({ timeout: '2s' });
      return h.status === 'red' ? 'unhealthy' : 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
