import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UserModel } from '../models/user.model';
import { UsersService } from '../../users/users.service';

@Resolver(() => UserModel)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) { }

    @Query(() => [UserModel], { description: 'Get all users with their posts' })
    async users(): Promise<UserModel[]> {
        return this.usersService.findAll() as any;
    }

    @Query(() => UserModel, { nullable: true, description: 'Get user by ID' })
    async user(@Args('id', { type: () => ID }) id: string): Promise<UserModel> {
        return this.usersService.findOne(id) as any;
    }

    @Mutation(() => UserModel, { description: 'Create a new user' })
    async createUser(
        @Args('name') name: string,
        @Args('email') email: string,
    ): Promise<UserModel> {
        return this.usersService.create({ name, email }) as any;
    }
}
