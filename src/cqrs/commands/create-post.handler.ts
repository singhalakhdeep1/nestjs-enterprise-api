import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePostCommand } from './create-post.command';
import { PostsService } from '../../posts/posts.service';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
    constructor(private readonly postsService: PostsService) { }

    async execute(command: CreatePostCommand) {
        const { title, content, authorId } = command;
        const post = await this.postsService.create({ title, content, authorId });
        return post;
    }
}
