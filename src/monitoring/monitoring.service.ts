import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class MonitoringService {
  getHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      platform: os.platform(),
      nodeVersion: process.version,
    };
  }

  getMetrics() {
    const memUsage = process.memoryUsage();
    return {
      process: {
        uptime: process.uptime(),
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
        },
        cpu: os.cpus(),
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
      },
    };
  }

  getStats() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: os.cpus(),
      loadavg: os.loadavg(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
    };
  }

  getAlerts() {
    const alerts = [];
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    if (memPercent > 80) {
      alerts.push({
        level: 'critical',
        type: 'memory',
        message: `Memory usage is ${memPercent.toFixed(2)}%`,
        value: memPercent,
      });
    } else if (memPercent > 60) {
      alerts.push({
        level: 'warning',
        type: 'memory',
        message: `Memory usage is ${memPercent.toFixed(2)}%`,
        value: memPercent,
      });
    }

    const loadAvg = os.loadavg();
    if (loadAvg[0] > os.cpus().length) {
      alerts.push({
        level: 'warning',
        type: 'cpu',
        message: `Load average is ${loadAvg[0].toFixed(2)}`,
        value: loadAvg[0],
      });
    }

    return {
      total: alerts.length,
      alerts,
    };
  }
}
