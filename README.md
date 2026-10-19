# NestJS Enterprise API

A NestJS 11 API serving one domain (users, posts, comments, tags) over REST, GraphQL, gRPC and WebSockets. Writes go through CQRS commands. Their domain events fan out to:
- Elasticsearch (search)
- RabbitMQ (integration events)
- EventStoreDB (event history)
- Redis (cache invalidation and real-time pub/sub)

Includes a Next.js test frontend (`frontend-test/`).

## Tech stack

- **NestJS 11** (TypeScript), dependency-injected modules, global JWT guard with `@Public()` and `@Roles()`
- **PostgreSQL + Prisma** for users (USER/ADMIN), posts, tags, comments and generic gRPC entities. Migrations are in `prisma/migrations`.
- **CQRS** (`@nestjs/cqrs`):
  - Commands: create, update and delete post; add and delete comment.
  - Queries: list and get posts, cached in Redis.
  - Events: handled by `PostEventsHandler`.
- **GraphQL**: Apollo Federation 2 subgraph (code first, `@key` on `User`/`Post`), plus a standalone Apollo Gateway (`npm run start:gateway`)
- **gRPC**: `EnterpriseService` from `src/integrations/proto/enterprise.proto`, running as a hybrid microservice on :50051
- **WebSockets**: socket.io gateway. `postUpdate` is broadcast to everyone, and per-post rooms (`post:<id>`) receive comment events. Optional JWT handshake.
- **Search**: Elasticsearch with multi-match, fuzziness, highlights and tag facets. It falls back to PostgreSQL when Elasticsearch isn't configured.
- **Integrations**: webhooks with signature verification (generic HMAC, GitHub `X-Hub-Signature-256`, Stripe `Stripe-Signature` with timestamp tolerance), Slack notifications, and an integration status view. See [NESTJS_ENTERPRISE_IMPLEMENTATION.md](NESTJS_ENTERPRISE_IMPLEMENTATION.md).
- **Cross-cutting** (see [NESTJS_ENTERPRISE_API_HLD_LLD.md](NESTJS_ENTERPRISE_API_HLD_LLD.md)):
  - Redis cache service.
  - Redis token-bucket rate limiter, plus a global throttler that also covers GraphQL.
  - Structured JSON logging with correlation IDs (`X-Correlation-Id`) and audit events.
  - Prometheus metrics and health checks that cover dependencies.

## Project structure

```
src/
├── main.ts                    # HTTP :4000 + gRPC :50051 (hybrid), Swagger at /api-docs
├── app.module.ts              # GraphQL federation subgraph, throttler, global guards
├── auth/                      # register / login (passport-local) / JWT strategy / profile
├── users/                     # users CRUD (admin), roles
├── posts/                     # REST controller + data access (posts, tags, comments)
├── cqrs/                      # commands, queries, domain events, PostEventsHandler fan-out
├── search/                    # Elasticsearch or PostgreSQL search, reindex
├── graphql/                   # models + resolvers (users, posts, comments, search)
├── gateway/main.ts            # Apollo Federation gateway
├── integrations/              # elasticsearch, rabbitmq, eventstore, redis, grpc server/client, webhooks
├── websockets/                # socket.io gateway (Redis pub/sub fan-out)
├── monitoring/                # health, Prometheus metrics, stats, alerts
└── common/                    # guards, decorators, cache / rate limiting / structured logging services
prisma/                        # schema.prisma (PostgreSQL), migrations, seed
frontend-test/                 # Next.js 14 test UI (feed, search, editor, post + comments, dashboard)
```

## Getting started

```bash
cp .env.example .env            # set DATABASE_URL and JWT_SECRET; the other services are optional
npm install --legacy-peer-deps  # also runs prisma generate
npx prisma migrate deploy
npm run prisma:seed             # admin@enterprise.io / user@enterprise.io, password ChangeMe123!
npm run start:dev               # http://localhost:4000
```

- REST docs: http://localhost:4000/api-docs
- GraphQL: http://localhost:4000/graphql
- gRPC: `localhost:50051`
- Health: http://localhost:4000/monitoring/health
- Metrics: http://localhost:4000/monitoring/metrics

The first account registered on an empty database becomes `ADMIN`. Port 4000 replaces the old 6000, which browsers block (it is on the fetch "bad ports" list).

Frontend:

```bash
cd frontend-test && npm install && npm run dev    # http://localhost:3103
```

Federation gateway (composes `GRAPHQL_SUBGRAPHS`):

```bash
npm run build && npm run start:gateway             # http://localhost:4001
```

### Everything with Docker

```bash
docker compose up --build
```

This starts:
- 2 API replicas behind nginx on :80
- the gateway on :4001 and the frontend on :3103
- PostgreSQL, Redis, Elasticsearch 8.17, RabbitMQ (UI on :15672) and EventStoreDB (:2113)
- Prometheus (:9090) and Grafana (:3000)

Migrations run when the API container starts.

## API overview

### REST

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | public |
| GET/PATCH | `/auth/profile` | user |
| GET | `/users`, `/users/:id` | user |
| POST | `/users` | admin |
| PATCH | `/users/:id/role` | admin |
| DELETE | `/users/:id` | admin |
| GET | `/posts?page&limit&tag&authorId`, `/posts/:id`, `/posts/tags` | public |
| POST | `/posts`, `/cqrs/posts` | user |
| PATCH/DELETE | `/posts/:id` | author or admin |
| POST | `/posts/:id/comments` | user |
| DELETE | `/posts/comments/:id` | author or admin |
| GET | `/posts/:id/history` (EventStoreDB) | user |
| GET | `/search?q&tag&page` | public |
| POST | `/search/reindex` | admin |
| POST | `/integrations/webhook`, `/integrations/github/webhook`, `/integrations/stripe/webhook` | signature |
| GET | `/integrations/status` | user |
| GET | `/integrations/webhooks/recent` | admin |
| POST | `/integrations/slack/send` | admin |
| GET/POST/PATCH/DELETE | `/integrations/grpc/entities[/:id]` (REST to gRPC) | user |
| GET | `/monitoring/health`, `/monitoring/metrics` | public |
| GET | `/monitoring/stats`, `/monitoring/alerts` | admin |

### GraphQL

```graphql
query { posts(limit: 10, tag: "nestjs") { total data { id title tags author { name } commentCount } } }
query { me { email posts { title } } }                      # Authorization: Bearer <token>
mutation { createPost(input: { title: "Hi", content: "...", tags: ["intro"] }) { id } }
query { searchPosts(q: "federation") { engine total results { title } } }
```

### gRPC

`enterprise.EnterpriseService`: `CreateEntity`, `GetEntity`, `UpdateEntity` (merges attributes), `DeleteEntity`, `StreamEntities` (server streaming).

### WebSockets

```js
const socket = io('http://localhost:4000', { auth: { token } });
socket.on('postUpdate', (m) => ...);          // { event: 'post.created' | 'post.updated' | 'post.deleted' | 'comment.added' | ..., postId, data }
socket.emit('joinRoom', `post:${id}`);         // then: socket.on('comment.added', ...)
```

## Tests and CI

- **Existing specs:** `npx jest`. `users.service.spec.ts` passes 6/6. `auth.service.spec.ts` does not compile because of a pre-existing typing issue: `jest.spyOn` on bcrypt resolves its callback overload. `test/app.e2e-spec.ts` imports vitest, which is not installed.
- **`.github/workflows/ci.yml`:** typecheck, build, migration plus drift check against Postgres, the users spec, frontend build, and Docker image and compose validation.
- **`.github/workflows/ci-cd.yml`:** `npm audit` (high and above), then publishes both images to GHCR on `main`.

## Verification

On a dev machine against PostgreSQL 18, Redis and Elasticsearch 8.17, 52 end-to-end checks passed:
- auth and roles
- CRUD through CQRS, with cache hit and invalidation
- Elasticsearch search (fuzzy, highlight, facets) and delete sync
- GraphQL queries and mutations, federation `_service` and `_entities`
- the gRPC server (CRUD, NOT_FOUND, streaming) and the REST-to-gRPC bridge
- websocket events through Redis pub/sub
- webhook signatures (valid, invalid, stale)
- metrics and RBAC

The frontend production build passes.

**Not run here:**
- RabbitMQ and EventStoreDB (no local brokers)
- a query through the federation gateway
- Docker images and the compose stack
