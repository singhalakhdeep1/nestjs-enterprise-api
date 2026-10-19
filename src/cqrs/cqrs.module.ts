import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrsController } from './cqrs.controller';
import { CommandHandlers } from './commands/create-post.handler';
import { QueryHandlers } from './queries/post.queries';
import { PostEventsHandler } from './events/post-events.handler';
import { PostsModule } from '../posts/posts.module';
import { PostsController } from '../posts/posts.controller';

@Module({
  imports: [CqrsModule, PostsModule],
  controllers: [PostsController, CqrsController],
  providers: [...CommandHandlers, ...QueryHandlers, PostEventsHandler],
})
export class CqrsPostsModule {}
