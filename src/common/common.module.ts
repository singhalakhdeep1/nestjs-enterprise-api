import { Global, Injectable, MiddlewareConsumer, Module, NestMiddleware, NestModule } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { CacheService } from './services/cache/cache.service';
import { RateLimitingService } from './services/rate-limiting/rate-limiting.service';
import { StructuredLoggingService } from './services/structured-logging/structured-logging.service';
import { httpRequests } from '../monitoring/metrics';

/** Correlation id per request + structured request log + Prometheus request counter. */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly logging: StructuredLoggingService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.header('x-correlation-id') || StructuredLoggingService.createCorrelationId();
    res.setHeader('X-Correlation-Id', correlationId);
    const start = Date.now();
    this.logging.runWithContext({ correlationId, ipAddress: req.ip, userAgent: req.header('user-agent') }, () => {
      res.on('finish', () => {
        const route = (req.route?.path as string) ?? req.path;
        httpRequests.inc({ method: req.method, route, status: String(res.statusCode) });
        if (!req.path.startsWith('/monitoring')) {
          this.logging.logInformation('request', { method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: Date.now() - start });
        }
      });
      next();
    });
  }
}

@Global()
@Module({
  providers: [CacheService, RateLimitingService, StructuredLoggingService],
  exports: [CacheService, RateLimitingService, StructuredLoggingService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('{*splat}');
  }
}
