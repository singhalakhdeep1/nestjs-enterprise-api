import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CqrsPostsModule } from './cqrs/cqrs.module';
import { SearchModule } from './search/search.module';
import { UsersResolver } from './graphql/resolvers/users.resolver';

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
            playground: true,
        }),
        CqrsModule,
        PrismaModule,
        UsersModule,
        PostsModule,
        CqrsPostsModule,
        SearchModule,
    ],
    providers: [UsersResolver],
})
export class AppModule { }
