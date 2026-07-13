import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return this.monitoringService.getHealth();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics' })
  getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Application statistics' })
  getStats() {
    return this.monitoringService.getStats();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Active system alerts' })
  getAlerts() {
    return this.monitoringService.getAlerts();
  }
}
