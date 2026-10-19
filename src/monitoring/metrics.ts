import client from 'prom-client';

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
});

export const wsConnections = new client.Gauge({
  name: 'websocket_connections',
  help: 'Open websocket connections',
  registers: [registry],
});
