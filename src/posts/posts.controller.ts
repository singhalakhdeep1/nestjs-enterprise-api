import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, DefaultValuePipe, ServiceUnavailableException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AddCommentCommand, CreatePostCommand, DeleteCommentCommand, DeletePostCommand, UpdatePostCommand } from '../cqrs/commands/create-post.command';
import { GetPostQuery, ListPostsQuery } from '../cqrs/queries/post.queries';
import { CurrentUser, Public, type AuthUser } from '../common/decorators/public.decorator';
import { PostsService } from './posts.service';
import { EventStoreService } from '../integrations/eventstore.service';

export class CreatePostDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsString() @IsNotEmpty() @MaxLength(20000) content: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(30, { each: true }) tags?: string[];
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdatePostDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(20000) content?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(30, { each: true }) tags?: string[];
  @IsOptional() @IsBoolean() published?: boolean;
}

export class CommentDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) content: string;
}

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly posts: PostsService,
    private readonly eventStore: EventStoreService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published posts (paginated, filter by tag/author)' })
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('tag') tag?: string,
    @Query('authorId') authorId?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.queryBus.execute(new ListPostsQuery({ page, limit, tag, authorId, viewerId: user?.id }));
  }

  @Public()
  @Get('tags')
  @ApiOperation({ summary: 'All tags with post counts' })
  tags() {
    return this.posts.tags();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a post with comments (counts a view)' })
  get(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.queryBus.execute(new GetPostQuery(id, user?.id, true));
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Event-sourced history of a post (EventStoreDB stream post-<id>)' })
  async history(@Param('id') id: string) {
    if (!this.eventStore.enabled) throw new ServiceUnavailableException('EventStoreDB is not configured');
    return this.eventStore.readStream(`post-${id}`);
  }

  @Post()
  @ApiOperation({ summary: 'Create a post (CreatePostCommand)' })
  create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new CreatePostCommand(dto.title, dto.content, user.id, dto.tags ?? [], dto.published ?? true));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post (author or admin)' })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new UpdatePostCommand(id, user.id, user.role, dto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post (author or admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new DeletePostCommand(id, user.id, user.role));
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Comment on a post' })
  comment(@Param('id') id: string, @Body() dto: CommentDto, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new AddCommentCommand(id, user.id, dto.content));
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment (author or admin)' })
  deleteComment(@Param('commentId') commentId: string, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new DeleteCommentCommand(commentId, user.id, user.role));
  }
}
