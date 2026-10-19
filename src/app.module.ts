import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CqrsPostsModule } from './cqrs/cqrs.module';
import { SearchModule } from './search/search.module';
import { AuthModule } from './auth/auth.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { PostsResolver, UsersResolver } from './graphql/resolvers/users.resolver';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '120', 10) }]),
    // Apollo Federation 2 subgraph; compose it with src/gateway/main.ts.
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: 2 },
      sortSchema: true,
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    CqrsModule.forRoot(),
    PrismaModule,
    CommonModule,
    IntegrationsModule,
    UsersModule,
    PostsModule,
    CqrsPostsModule,
    SearchModule,
    AuthModule,
    WebsocketsModule,
    MonitoringModule,
  ],
  providers: [
    UsersResolver,
    PostsResolver,
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
