# NestJS Enterprise API - Implementation

## Overview
This document describes the enterprise integrations added to NestJS Enterprise API.

## Technologies Added

### 1. gRPC
- NestJS microservices gRPC client
- Protocol Buffers definition
- Enterprise service client
- CRUD operations via gRPC
- Streaming support
- Connection lifecycle management

### 2. EventStoreDB
- EventStoreDB client integration
- Event appending to streams
- Stream reading
- Stream subscriptions
- Stream metadata management
- Connection initialization
- JSON event serialization

### 3. RabbitMQ
- AMQP connection manager
- Queue management
- Exchange management (direct, topic, fanout)
- Message publishing
- Message consumption
- Queue binding
- Acknowledgment handling

### 4. Elasticsearch
- Elasticsearch client
- Index management
- Document CRUD operations
- Search queries
- Aggregations
- Bulk operations
- Connection health check

### 5. Redis
- ioredis client
- Key-value operations
- Hash operations
- List operations
- Set operations
- Increment/decrement
- Pub/sub messaging
- Subscription handling

### 6. GraphQL Federation
- Apollo Gateway driver
- Supergraph SDL loading
- Service list configuration
- Subgraph schemas
- Federation directives (@key, @shareable, @extends)
- Introspection and reflection
- WebSocket subscriptions

## Files Created

### Integration Services
- `src/integrations/grpc.service.ts` - gRPC service
- `src/integrations/eventstore.service.ts` - EventStoreDB service
- `src/integrations/rabbitmq.service.ts` - RabbitMQ service
- `src/integrations/elasticsearch.service.ts` - Elasticsearch service
- `src/integrations/redis.service.ts` - Redis service
- `src/integrations/graphql-federation.service.ts` - GraphQL Federation service

### Protocol Buffers
- `src/integrations/proto/enterprise.proto` - gRPC schema

## Installation Required

Add to `package.json`:
```json
{
  "dependencies": {
    "@nestjs/microservices": "^10.3.0",
    "@grpc/grpc-js": "^1.9.0",
    "@grpc/proto-loader": "^0.7.0",
    "@eventstore/db-client": "^5.0.0",
    "amqp-connection-manager": "^4.1.0",
    "@elastic/elasticsearch": "^8.11.0",
    "ioredis": "^5.3.0",
    "@nestjs/apollo": "^12.0.0",
    "@apollo/gateway": "^2.5.0",
    "graphql": "^16.8.0"
  }
}
```

Run:
```bash
npm install
```

## Environment Variables

```env
# gRPC
GRPC_URL=localhost:50051

# EventStoreDB
EVENTSTORE_URL=localhost:2113

# RabbitMQ
RABBITMQ_URL=amqp://localhost

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Redis
REDIS_URL=localhost:6379

# GraphQL Federation
USERS_SERVICE_URL=http://localhost:3001/graphql
POSTS_SERVICE_URL=http://localhost:3002/graphql
AUTH_SERVICE_URL=http://localhost:3003/graphql
```

## Notes
- All code is written but packages are not installed (per user request)
- gRPC requires Protocol Buffers compilation
- EventStoreDB requires EventStoreDB server
- RabbitMQ requires RabbitMQ server
- Elasticsearch requires Elasticsearch cluster
- Redis requires Redis server
- GraphQL Federation requires subgraph services
- Supergraph SDL needs to be generated via rover CLI
