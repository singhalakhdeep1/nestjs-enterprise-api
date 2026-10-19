import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AddCommentCommand, CreatePostCommand, DeleteCommentCommand, DeletePostCommand, UpdatePostCommand } from './create-post.command';
import { CommentAddedEvent, CommentDeletedEvent, PostCreatedEvent, PostDeletedEvent, PostUpdatedEvent } from '../events/post.events';
import { PostsService } from '../../posts/posts.service';

const assertOwner = (authorId: string, actorId: string, role: string) => {
  if (authorId !== actorId && role !== 'ADMIN') throw new ForbiddenException('Only the author or an admin can change this');
};

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
  constructor(private readonly postsService: PostsService, private readonly eventBus: EventBus) {}

  async execute(command: CreatePostCommand) {
    const { title, content, authorId, tags, published } = command;
    const post = await this.postsService.create({ title, content, authorId, tags, published });
    this.eventBus.publish(new PostCreatedEvent(post, authorId));
    return post;
  }
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand> {
  constructor(private readonly postsService: PostsService, private readonly eventBus: EventBus) {}

  async execute({ id, actorId, actorRole, changes }: UpdatePostCommand) {
    const existing = await this.postsService.findOne(id);
    if (!existing) throw new NotFoundException('Post not found');
    assertOwner(existing.authorId, actorId, actorRole);
    const post = await this.postsService.update(id, changes);
    this.eventBus.publish(new PostUpdatedEvent(post, actorId, Object.keys(changes)));
    return post;
  }
}

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<DeletePostCommand> {
  constructor(private readonly postsService: PostsService, private readonly eventBus: EventBus) {}

  async execute({ id, actorId, actorRole }: DeletePostCommand) {
    const existing = await this.postsService.findOne(id);
    if (!existing) throw new NotFoundException('Post not found');
    assertOwner(existing.authorId, actorId, actorRole);
    await this.postsService.delete(id);
    this.eventBus.publish(new PostDeletedEvent(id, actorId, existing.title));
    return { deleted: true, id };
  }
}

@CommandHandler(AddCommentCommand)
export class AddCommentHandler implements ICommandHandler<AddCommentCommand> {
  constructor(private readonly postsService: PostsService, private readonly eventBus: EventBus) {}

  async execute({ postId, authorId, content }: AddCommentCommand) {
    const post = await this.postsService.findOne(postId);
    if (!post || (!post.published && post.authorId !== authorId)) throw new NotFoundException('Post not found');
    const comment = await this.postsService.addComment(postId, authorId, content);
    this.eventBus.publish(new CommentAddedEvent(postId, comment));
    return comment;
  }
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand> {
  constructor(private readonly postsService: PostsService, private readonly eventBus: EventBus) {}

  async execute({ commentId, actorId, actorRole }: DeleteCommentCommand) {
    const comment = await this.postsService.findComment(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    assertOwner(comment.authorId, actorId, actorRole);
    await this.postsService.deleteComment(commentId);
    this.eventBus.publish(new CommentDeletedEvent(comment.postId, commentId, actorId));
    return { deleted: true, id: commentId };
  }
}

export const CommandHandlers = [CreatePostHandler, UpdatePostHandler, DeletePostHandler, AddCommentHandler, DeleteCommentHandler];
