import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent, ResolveReference, Int } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserModel } from '../models/user.model';
import { CreatePostInput, PostModel, PostPage, SearchResult, UpdatePostInput, CommentModel } from '../models/post.model';
import { UsersService, sanitize } from '../../users/users.service';
import { AuthService } from '../../auth/auth.service';
import { PostsService } from '../../posts/posts.service';
import { SearchService } from '../../search/search.service';
import { CurrentUser, Public, Roles, type AuthUser } from '../../common/decorators/public.decorator';
import { AddCommentCommand, CreatePostCommand, DeletePostCommand, UpdatePostCommand } from '../../cqrs/commands/create-post.command';
import { GetPostQuery, ListPostsQuery } from '../../cqrs/queries/post.queries';

/* eslint-disable @typescript-eslint/no-explicit-any */
const toPost = (p: any): PostModel => ({
  ...p,
  tags: (p.tags ?? []).map((t: any) => (typeof t === 'string' ? t : t.name)),
  commentCount: p._count?.comments ?? p.comments?.length ?? 0,
  comments: p.comments,
  createdAt: new Date(p.createdAt),
  updatedAt: new Date(p.updatedAt),
});

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService, private readonly authService: AuthService, private readonly postsService: PostsService) {}

  @Query(() => [UserModel], { description: 'Users (paginated)' })
  async users(@Args('page', { type: () => Int, defaultValue: 1 }) page: number, @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number) {
    return (await this.usersService.findAll(page, Math.min(limit, 100))).data.map((u) => sanitize(u));
  }

  @Query(() => UserModel, { nullable: true, description: 'Get user by ID' })
  async user(@Args('id', { type: () => ID }) id: string) {
    return sanitize(await this.usersService.findOne(id));
  }

  @Query(() => UserModel, { description: 'The authenticated user' })
  async me(@CurrentUser() user: AuthUser) {
    return sanitize(await this.usersService.findOne(user.id));
  }

  @Mutation(() => UserModel, { description: 'Create a user (admin)' })
  @Roles('ADMIN')
  async createUser(@Args('name') name: string, @Args('email') email: string, @Args('password') password: string) {
    return this.authService.register(name, email.toLowerCase(), password);
  }

  @ResolveField(() => [PostModel])
  async posts(@Parent() user: UserModel) {
    return (await this.postsService.findAll({ authorId: user.id, limit: 100 })).data.map(toPost);
  }

  @ResolveReference()
  async resolveReference(ref: { __typename: string; id: string }) {
    return sanitize(await this.usersService.findOne(ref.id));
  }
}

@Resolver(() => PostModel)
export class PostsResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly usersService: UsersService,
    private readonly search: SearchService,
  ) {}

  @Public()
  @Query(() => PostPage, { description: 'Published posts' })
  async posts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('tag', { nullable: true }) tag?: string,
  ) {
    const res = await this.queryBus.execute(new ListPostsQuery({ page, limit, tag }));
    return { data: res.data.map(toPost), total: res.meta.total, page: res.meta.page, totalPages: res.meta.totalPages };
  }

  @Public()
  @Query(() => PostModel, { nullable: true })
  async post(@Args('id', { type: () => ID }) id: string, @CurrentUser() user?: AuthUser) {
    try {
      return toPost(await this.queryBus.execute(new GetPostQuery(id, user?.id)));
    } catch (e) {
      if (e instanceof NotFoundException) return null;
      throw e;
    }
  }

  @Public()
  @Query(() => SearchResult)
  async searchPosts(@Args('q') q: string, @Args('tag', { nullable: true }) tag?: string) {
    return this.search.searchPosts(q, tag);
  }

  @Mutation(() => PostModel)
  async createPost(@Args('input') input: CreatePostInput, @CurrentUser() user: AuthUser) {
    return toPost(await this.commandBus.execute(new CreatePostCommand(input.title, input.content, user.id, input.tags ?? [], input.published ?? true)));
  }

  @Mutation(() => PostModel)
  async updatePost(@Args('id', { type: () => ID }) id: string, @Args('input') input: UpdatePostInput, @CurrentUser() user: AuthUser) {
    return toPost(await this.commandBus.execute(new UpdatePostCommand(id, user.id, user.role, input)));
  }

  @Mutation(() => Boolean)
  async deletePost(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: AuthUser) {
    return (await this.commandBus.execute(new DeletePostCommand(id, user.id, user.role))).deleted;
  }

  @Mutation(() => CommentModel)
  async addComment(@Args('postId', { type: () => ID }) postId: string, @Args('content') content: string, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new AddCommentCommand(postId, user.id, content));
  }

  @ResolveField(() => UserModel, { nullable: true })
  async author(@Parent() post: PostModel) {
    return post.author ?? sanitize(await this.usersService.findOne(post.authorId));
  }

  @ResolveReference()
  async resolveReference(ref: { __typename: string; id: string }) {
    try {
      return toPost(await this.queryBus.execute(new GetPostQuery(ref.id)));
    } catch {
      return null;
    }
  }
}
