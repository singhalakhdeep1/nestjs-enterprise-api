import { Controller, Post, Get, Body } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePostCommand } from './commands/create-post.command';
import { IsNotEmpty, IsString } from 'class-validator';

class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    authorId: string;
}

@Controller('cqrs')
export class CqrsController {
    constructor(private readonly commandBus: CommandBus) { }

    @Post('posts')
    async createPost(@Body() dto: CreatePostDto) {
        const post = await this.commandBus.execute(
            new CreatePostCommand(dto.title, dto.content, dto.authorId),
        );
        return post;
    }
}
