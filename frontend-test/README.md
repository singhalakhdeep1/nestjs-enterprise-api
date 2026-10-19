# NestJS Enterprise Frontend Test Dashboard

Next.js 14 (App Router, TypeScript, Tailwind) UI for the NestJS Enterprise API.

## Pages

- `/`: feed of published posts with tag filter, Elasticsearch search (highlights) and live updates over socket.io
- `/posts/new`: create, or edit with `?edit=<id>` (title, content, tags, draft/published)
- `/posts/[id]`: post detail with comments (add/delete), edit/delete for the author or an admin, live comment updates (room `post:<id>`)
- `/dashboard`: my posts, system health (database/Redis/Elasticsearch/RabbitMQ/EventStore), integration status, users
- `/auth/login`, `/auth/register`

## Run

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                  # http://localhost:3103
```

The API must allow this origin (`CORS_ORIGIN=http://localhost:3103`, the default).
