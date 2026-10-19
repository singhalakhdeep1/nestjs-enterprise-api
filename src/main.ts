import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { grpcServerOptions } from './integrations/grpc.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  app.set('trust proxy', 1);
  // GraphQL's embedded landing page needs inline scripts, so CSP is relaxed only for that path.
  app.use((req: { path: string }, res: unknown, next: () => void) =>
    (req.path.startsWith('/graphql') ? helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }) : helmet())(req as never, res as never, next),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3103').split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Correlation-Id',
    credentials: true,
  });
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('NestJS Enterprise API')
    .setDescription('REST + GraphQL (federation subgraph) + gRPC + WebSockets, CQRS, Elasticsearch, RabbitMQ, EventStoreDB, Redis')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('posts', 'Posts and comments (CQRS)')
    .addTag('search', 'Full-text search')
    .addTag('integrations', 'Webhooks, Slack, gRPC bridge')
    .addTag('monitoring', 'Health and metrics')
    .build();
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, config));

  // gRPC EnterpriseService runs alongside HTTP (hybrid application).
  app.connectMicroservice(grpcServerOptions(), { inheritAppConfig: true });
  await app.startAllMicroservices();

  // Note: 6000 (the old default) is on browsers' blocked-port list, so the API uses 4000.
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(JSON.stringify({ level: 'Information', message: `API on :${port} (GraphQL /graphql, docs /api-docs, gRPC ${grpcServerOptions().options.url})` }));
}

bootstrap();
