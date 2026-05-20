import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { PostsModule } from '../posts/posts.module';

@Module({
    imports: [PostsModule],
    controllers: [SearchController],
    providers: [SearchService],
})
export class SearchModule { }
