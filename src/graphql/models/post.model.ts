import { ObjectType, Field, ID, Int, Directive, InputType } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserModel } from './user.model';

@ObjectType('Comment')
export class CommentModel {
  @Field(() => ID) id: string;
  @Field() content: string;
  @Field() authorId: string;
  @Field(() => UserModel, { nullable: true }) author?: UserModel;
  @Field() createdAt: Date;
}

@ObjectType('Post')
@Directive('@key(fields: "id")')
export class PostModel {
  @Field(() => ID) id: string;
  @Field() title: string;
  @Field() content: string;
  @Field() published: boolean;
  @Field() authorId: string;
  @Field(() => UserModel, { nullable: true }) author?: UserModel;
  @Field(() => [String]) tags: string[];
  @Field(() => Int) viewCount: number;
  @Field(() => Int) commentCount: number;
  @Field(() => [CommentModel], { nullable: true }) comments?: CommentModel[];
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType('PostPage')
export class PostPage {
  @Field(() => [PostModel]) data: PostModel[];
  @Field(() => Int) total: number;
  @Field(() => Int) page: number;
  @Field(() => Int) totalPages: number;
}

@InputType()
export class CreatePostInput {
  @Field() @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @Field() @IsString() @IsNotEmpty() @MaxLength(20000) content: string;
  @Field(() => [String], { nullable: true }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @Field({ nullable: true }) @IsOptional() @IsBoolean() published?: boolean;
}

@InputType()
export class UpdatePostInput {
  @Field({ nullable: true }) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(20000) content?: string;
  @Field(() => [String], { nullable: true }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @Field({ nullable: true }) @IsOptional() @IsBoolean() published?: boolean;
}

@ObjectType('SearchHit')
export class SearchHit {
  @Field(() => ID) id: string;
  @Field() title: string;
  @Field() content: string;
  @Field(() => [String]) tags: string[];
  @Field({ nullable: true }) authorName?: string;
}

@ObjectType('SearchResult')
export class SearchResult {
  @Field() engine: string;
  @Field(() => Int) total: number;
  @Field(() => [SearchHit]) results: SearchHit[];
}
