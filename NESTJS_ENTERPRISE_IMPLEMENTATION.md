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

## How each integration is wired

| Integration | Code | Used for | Enable with |
|---|---|---|---|
| gRPC | `src/integrations/grpc.controller.ts` (server), `grpc.service.ts` (client) | `EnterpriseService` from `proto/enterprise.proto` runs as a hybrid microservice next to HTTP, backed by the `Entity` table (CRUD + server streaming). REST bridge at `/integrations/grpc/entities` | `GRPC_URL` (default `0.0.0.0:50051`) |
| EventStoreDB | `src/integrations/eventstore.service.ts` | Every CQRS domain event is appended to stream `post-<id>`; `GET /posts/:id/history` replays it | `EVENTSTORE_CONNECTION_STRING` |
| RabbitMQ | `src/integrations/rabbitmq.service.ts` | Domain events (`post.*`, `comment.*`, `webhook.*`) published to a durable topic exchange with reconnects and publisher confirms; `subscribe()` for consumers | `RABBITMQ_URL` |
| Elasticsearch | `src/integrations/elasticsearch.service.ts` | Posts index kept in sync by the event handler; `GET /search` uses multi_match + fuzziness + highlights + tag facets; `POST /search/reindex` | `ELASTICSEARCH_NODE` (unset = PostgreSQL search) |
| Redis | `src/integrations/redis.service.ts`, `src/common/services/*` | Cache-aside for post reads, token-bucket rate limiter (Lua), view counters, recent webhooks, pub/sub that fans real-time events to the socket.io gateway on every instance | `REDIS_URL` |
| GraphQL Federation | `src/app.module.ts` (subgraph), `src/integrations/graphql-federation.service.ts` + `src/gateway/main.ts` (gateway) | The API is an Apollo Federation 2 subgraph (`@key` on `User` and `Post`, `_entities` resolvers); the gateway composes `GRAPHQL_SUBGRAPHS` with IntrospectAndCompose and forwards auth | `npm run start:gateway` |

All integrations are optional at runtime: when the variable is unset the service reports `disabled` in `/monitoring/health` and the app keeps working. `docker-compose.yml` turns all of them on.

## Verification

Verified locally against PostgreSQL 18, Redis and Elasticsearch 8.17: 52 end-to-end checks covering REST, GraphQL (including `_service` and `_entities`), the gRPC server (direct `@grpc/grpc-js` client: CRUD, NOT_FOUND, streaming) and REST-to-gRPC bridge, Elasticsearch indexing/search/delete, Redis cache and pub/sub to websockets, and the GitHub/Stripe/generic webhook signatures.

Not run here: RabbitMQ and EventStoreDB (no local brokers), the federation gateway query path, Docker images.
