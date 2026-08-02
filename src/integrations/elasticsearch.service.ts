// Elasticsearch integration for nestjs-enterprise-api

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: 'http://localhost:9200',
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      console.log('Connected to Elasticsearch');
    } catch (error) {
      console.error('Failed to connect to Elasticsearch:', error);
    }
  }

  onModuleDestroy() {
    this.client.close();
  }

  async createIndex(indexName: string, mapping?: any) {
    const exists = await this.client.indices.exists({ index: indexName });
    
    if (!exists) {
      return this.client.indices.create({
        index: indexName,
        body: mapping ? { mappings: mapping } : undefined,
      });
    }
  }

  async deleteIndex(indexName: string) {
    return this.client.indices.delete({ index: indexName });
  }

  async indexDocument(indexName: string, id: string, document: any) {
    return this.client.index({
      index: indexName,
      id: id,
      body: document,
    });
  }

  async getDocument(indexName: string, id: string) {
    return this.client.get({
      index: indexName,
      id: id,
    });
  }

  async updateDocument(indexName: string, id: string, document: any) {
    return this.client.update({
      index: indexName,
      id: id,
      body: { doc: document },
    });
  }

  async deleteDocument(indexName: string, id: string) {
    return this.client.delete({
      index: indexName,
      id: id,
    });
  }

  async search(indexName: string, query: any) {
    return this.client.search({
      index: indexName,
      body: query,
    });
  }

  async searchWithAggregations(indexName: string, query: any, aggregations: any) {
    return this.client.search({
      index: indexName,
      body: {
        query,
        aggregations,
      },
    });
  }

  async bulkIndex(indexName: string, documents: any[]) {
    const body = documents.flatMap(doc => [
      { index: { _index: indexName, _id: doc.id } },
      doc,
    ]);

    return this.client.bulk({ body });
  }
}
