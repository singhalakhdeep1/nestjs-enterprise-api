import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePostCommand } from './commands/create-post.command';
import { CreatePostDto } from '../posts/posts.controller';
import { CurrentUser, type AuthUser } from '../common/decorators/public.decorator';

/** Explicit CQRS entry point (same command as POST /posts). The author is the authenticated user. */
@ApiTags('posts')
@ApiBearerAuth()
@Controller('cqrs')
export class CqrsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('posts')
  @ApiOperation({ summary: 'Create post via CreatePostCommand' })
  createPost(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    return this.commandBus.execute(new CreatePostCommand(dto.title, dto.content, user.id, dto.tags ?? [], dto.published ?? true));
  }
}
