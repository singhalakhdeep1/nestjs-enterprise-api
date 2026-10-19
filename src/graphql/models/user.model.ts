import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';

@ObjectType('User')
@Directive('@key(fields: "id")')
export class UserModel {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() email: string;
  @Field() role: string;
  @Field() createdAt: Date;
}
