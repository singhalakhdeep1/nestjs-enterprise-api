# NestJS Enterprise Frontend Test Dashboard

A modern Next.js test dashboard for the NestJS Enterprise API, built with TypeScript and Tailwind CSS.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Full type safety
- **Tailwind CSS** - Modern utility-first styling
- **React 18** - UI library

## Features

- **User CRUD Operations** - Create and fetch users via Prisma ORM
- **CQRS Pattern Testing** - Create posts using Command-Query Responsibility Segregation
- **Full-Text Search** - Search posts with the search endpoint
- **GraphQL Integration** - Direct link to GraphQL Playground
- **Type-Safe API Client** - Custom API client with error handling
- **Modern UI** - Clean, responsive design with Tailwind CSS
- **Error Handling** - User-friendly error messages and loading states

## Getting Started

### Prerequisites

- Node.js 18+ installed
- NestJS Enterprise API backend running on `http://localhost:6000`

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend-test
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at **http://localhost:3103**

### Environment Variables

Edit `.env.local` to configure the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:6000
```

## Available Scripts

- `npm run dev` - Start development server on port 3103
- `npm run build` - Build for production
- `npm start` - Start production server on port 3103
- `npm run lint` - Run ESLint

## Project Structure

```
frontend-test/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Main dashboard page
│   └── globals.css      # Global styles and Tailwind imports
├── lib/
│   └── api-client.ts    # Type-safe API client with error handling
├── public/              # Static assets
├── next.config.js       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## API Integration

The frontend connects to the NestJS Enterprise API using a custom API client (`lib/api-client.ts`) that provides:

- Type-safe API calls
- Automatic error handling
- Loading state management
- Environment-based configuration

### API Endpoints Used

- `POST /users` - Create a new user
- `GET /users` - Fetch all users
- `GET /users/:id` - Fetch a specific user
- `POST /cqrs/posts` - Create a post via CQRS
- `GET /search?q=term` - Search posts

## Testing the Integration

1. **Start the Backend** (in the root directory):
```bash
cd ..
npm run setup
npm run dev
```

2. **Start the Frontend** (in the frontend-test directory):
```bash
cd frontend-test
npm install
npm run dev
```

3. **Open the Dashboard**:
   - Frontend: http://localhost:3103
   - Backend API: http://localhost:6000
   - GraphQL Playground: http://localhost:6000/graphql

4. **Test Features**:
   - Click "Create User" to add users via Prisma
   - Click "Fetch Users" to retrieve all users
   - Click "Create Post (Command)" to test CQRS pattern
   - Use the search input to test full-text search
   - Click "Open GraphQL Playground" to test GraphQL queries

## Development Notes

- The frontend uses the App Router (Next.js 14)
- All components are client-side rendered ('use client')
- TypeScript provides full type safety for API responses
- Tailwind CSS provides a modern, responsive design
- Error states are displayed with user-friendly messages
- Loading states prevent duplicate requests

## Troubleshooting

### Backend Connection Issues

If the frontend can't connect to the backend:

1. Ensure the backend is running on port 6000
2. Check that `.env.local` has the correct `NEXT_PUBLIC_API_URL`
3. Verify CORS is enabled on the backend (it is by default)

### Build Errors

If you encounter build errors:

1. Delete `node_modules` and `.next` folders
2. Run `npm install` again
3. Run `npm run build`

### TypeScript Errors

TypeScript errors are expected before running `npm install`. After installing dependencies, all type errors should resolve.

## License

Proprietary - All rights reserved.
