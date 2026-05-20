import { Injectable } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';

/**
 * SearchService simulates Elasticsearch full-text search
 * using Prisma database queries (contains/OR pattern).
 * Drop-in Elasticsearch client can replace this in production.
 */
@Injectable()
export class SearchService {
    constructor(private readonly postsService: PostsService) { }

    async searchPosts(query: string) {
        if (!query || query.trim() === '') {
            return this.postsService.findAll();
        }
        return this.postsService.search(query.trim());
    }
}
