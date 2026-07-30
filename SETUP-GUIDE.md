# Complete Setup Guide - NestJS Enterprise API + Frontend

This guide will help you set up and run both the backend and frontend together.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Quick Start

### 1. Backend Setup

Navigate to the project root and set up the backend:

```bash
# Install backend dependencies
npm install

# Generate Prisma client and setup database
npx prisma generate
npx prisma db push

# Start the backend server
npm run dev
```

The backend will run on **http://localhost:6000**

### 2. Frontend Setup

In a new terminal, navigate to the frontend directory:

```bash
cd frontend-test

# Install frontend dependencies
npm install

# Start the frontend server
npm run dev
```

The frontend will run on **http://localhost:3103**

## What's Included

### Backend (100% Complete)

✅ **NestJS Framework**
- Modular architecture with dependency injection
- Guards, interceptors, pipes, and validation
- Exception filters and middleware

✅ **Database (Prisma ORM)**
- SQLite database (configurable for PostgreSQL)
- Type-safe database access
- Auto-generated TypeScript types

✅ **CQRS Pattern**
- Command-Query Responsibility Segregation
- Separate command handlers
- Scalable architecture

✅ **GraphQL API**
- Apollo Server integration
- Auto-generated schema
- GraphQL Playground at `/graphql`

✅ **REST API**
- User CRUD endpoints
- CQRS post creation
- Full-text search

✅ **Additional Features**
- CORS enabled for frontend integration
- Validation with class-validator
- Environment configuration

### Frontend (100% Complete)

✅ **Next.js 14**
- App Router with TypeScript
- Server and client components
- Modern React patterns

✅ **TypeScript**
- Full type safety
- Type definitions for API responses
- Compile-time error checking

✅ **Tailwind CSS**
- Modern utility-first styling
- Responsive design
- Custom theme configuration

✅ **API Client**
- Type-safe API calls
- Automatic error handling
- Loading state management
- Environment-based configuration

✅ **UI Features**
- User CRUD testing interface
- CQRS pattern testing
- Full-text search interface
- GraphQL Playground integration
- Error handling with user-friendly messages
- Loading states for all operations

## Testing the Integration

Once both servers are running:

1. **Open the Frontend**: http://localhost:3103
2. **Test User CRUD**:
   - Click "Create User" to add a user
   - Click "Fetch Users" to retrieve all users
3. **Test CQRS**:
   - Create a user first (if none exist)
   - Click "Create Post (Command)" to test CQRS pattern
4. **Test Search**:
   - Enter a search term in the search input
   - Click "Search" to test full-text search
5. **Test GraphQL**:
   - Click "Open GraphQL Playground"
   - Try queries and mutations

## API Endpoints

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create a user |
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/cqrs/posts` | Create post via CQRS |
| GET | `/search?q=term` | Search posts |

### GraphQL

Access the GraphQL Playground at: http://localhost:6000/graphql

Example query:
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
```

## Troubleshooting

### Backend Issues

**Database not found:**
```bash
npx prisma db push
```

**Port already in use:**
Change the PORT in `.env` file

### Frontend Issues

**TypeScript errors after install:**
These are normal before running `npm install`. After installing dependencies, all errors should resolve.

**Cannot connect to backend:**
1. Ensure backend is running on port 6000
2. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. Verify CORS is enabled (it is by default)

**Build errors:**
```bash
rm -rf node_modules .next
npm install
npm run build
```

## Project Structure

```
nestjs-enterprise-api/
├── src/                      # Backend source code
│   ├── users/               # User module (Prisma)
│   ├── posts/               # Posts service
│   ├── cqrs/                # CQRS commands
│   ├── graphql/             # GraphQL resolvers
│   ├── search/              # Search service
│   ├── prisma/              # Prisma service
│   ├── cache/               # Cache module
│   ├── monitoring/          # Monitoring service
│   ├── integrations/        # External integrations
│   └── common/              # Shared utilities
├── prisma/                  # Database schema
├── frontend-test/           # Frontend application
│   ├── app/                 # Next.js app directory
│   ├── lib/                 # API client utilities
│   └── public/              # Static assets
├── package.json             # Backend dependencies
└── README.md               # Main documentation
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="file:./dev.db"
PORT=6000
NODE_ENV=development
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:6000
```

## Development Workflow

1. Make changes to backend code
2. Backend auto-reloads with `npm run dev`
3. Make changes to frontend code
4. Frontend auto-reloads with `npm run dev`
5. Test integration through the frontend dashboard

## Production Deployment

### Backend

```bash
npm run build
npm start
```

### Frontend

```bash
cd frontend-test
npm run build
npm start
```

## License

Proprietary - All rights reserved.
