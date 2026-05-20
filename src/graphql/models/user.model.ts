import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PostModel } from './post.model';

@ObjectType()
export class UserModel {
    @Field(() => ID)
    id: string;

    @Field()
    name: string;

    @Field()
    email: string;

    @Field()
    createdAt: Date;

    @Field(() => [PostModel], { nullable: true })
    posts?: PostModel[];
}
