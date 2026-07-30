import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    // Swagger Configuration
    const config = new DocumentBuilder()
        .setTitle('NestJS Enterprise API')
        .setDescription('Enterprise-grade REST + GraphQL API with authentication, CQRS, and more')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management')
        .addTag('posts', 'Post management with CQRS')
        .addTag('search', 'Full-text search')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    const port = process.env.PORT || 6000;
    await app.listen(port);
    console.log(`🚀 NestJS Enterprise API running on http://localhost:${port}`);
    console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
    console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
}
bootstrap();
