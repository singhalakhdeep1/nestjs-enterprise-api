# NestJS Enterprise API

Enterprise-grade REST + GraphQL API built with NestJS, TypeScript, Prisma ORM, CQRS pattern, and full-text search.

## Tech Stack

- **NestJS** — Modular, decorator-based Node.js framework
- **TypeScript** — Full type safety across the codebase
- **Prisma ORM** — Type-safe database access with SQLite
- **CQRS Pattern** — Command-Query Responsibility Segregation via `@nestjs/cqrs`
- **GraphQL** — Auto-schema GraphQL API via Apollo Server
- **Search** — Full-text post search endpoint

## Project Structure

```
src/
├── app.module.ts           # Root module
├── main.ts                 # Entry point (port 6000)
├── prisma/                 # Prisma service & module
├── users/                  # Users CRUD (Prisma)
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── posts/                  # Posts service (shared)
├── cqrs/                   # CQRS command handlers
│   └── commands/
│       ├── create-post.command.ts
│       └── create-post.handler.ts
├── search/                 # Full-text search endpoint
└── graphql/                # GraphQL resolvers & models
    ├── models/
    └── resolvers/
prisma/
└── schema.prisma           # SQLite schema (User, Post)
frontend-test/              # Next.js test dashboard (port 3103)
```

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client & push schema to SQLite
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Server runs at **http://localhost:6000**

## API Endpoints

### REST

| Method | Endpoint         | Description                  |
| ------ | ---------------- | ---------------------------- |
| `POST` | `/users`         | Create a user                |
| `GET`  | `/users`         | Get all users                |
| `GET`  | `/users/:id`     | Get user by ID               |
| `POST` | `/cqrs/posts`    | Create post via CQRS command |
| `GET`  | `/search?q=term` | Full-text search posts       |

### GraphQL

Playground available at **http://localhost:6000/graphql**

```graphql
query {
  users {
    id
    name
    email
    posts {
      title
      content
    }
  }
}

mutation {
  createUser(name: "Alice", email: "alice@example.com") {
    id
    name
  }
}
```

## Environment Variables

Copy `.env.example` to `.env`:

```env
DATABASE_URL="file:./dev.db"
PORT=6000
NODE_ENV=development
```

## NestJS Concepts Demonstrated

| Concept               | Where                    |
| --------------------- | ------------------------ |
| Dependency Injection  | All services & modules   |
| Modular Architecture  | `*.module.ts` files      |
| Guards & Interceptors | NestJS global pipes      |
| Pipes & Validation    | `class-validator` DTOs   |
| Exception Filters     | Built-in HTTP exceptions |
| CQRS Commands         | `src/cqrs/commands/`     |
| GraphQL Resolvers     | `src/graphql/resolvers/` |
| Prisma Integration    | `src/prisma/`            |

## Frontend Test Dashboard

```bash
cd frontend-test
npm install
npm run dev   # http://localhost:3103
```

Tests: User CRUD, CQRS post creation, search, and GraphQL playground.

---

## 📝 License

Proprietary - All rights reserved.
