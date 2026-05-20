import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrsController } from './cqrs.controller';
import { CreatePostHandler } from './commands/create-post.handler';
import { PostsModule } from '../posts/posts.module';

@Module({
    imports: [CqrsModule, PostsModule],
    controllers: [CqrsController],
    providers: [CreatePostHandler],
})
export class CqrsPostsModule { }
