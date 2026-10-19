import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { MonitoringService } from './monitoring.service';
import { Public, Roles } from '../common/decorators/public.decorator';

@ApiTags('monitoring')
@SkipThrottle()
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check with dependency status (503 when the database is down)' })
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const h = await this.monitoringService.getHealth();
    if (h.status === 'unhealthy') res.status(503);
    return h;
  }

  @Public()
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  @ApiOperation({ summary: 'Prometheus metrics' })
  getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('stats')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Application statistics' })
  getStats() {
    return this.monitoringService.getStats();
  }

  @Get('alerts')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Active system alerts' })
  getAlerts() {
    return this.monitoringService.getAlerts();
  }
}
