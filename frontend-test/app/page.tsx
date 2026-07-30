'use client';

import { useState, useEffect } from 'react';
import { apiClient, User, Post, ApiError } from '@/lib/api-client';
import Link from 'next/link';
import './globals.css';

export default function NestJSTestDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [commandResult, setCommandResult] = useState<Post | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchUsers();
  }, []);

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    }
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // CRUD Operations
  const createUser = async () => {
    setLoading((prev) => ({ ...prev, createUser: true }));
    setError(null);
    try {
      const data = await apiClient.createUser({
        name: `User ${Date.now()}`,
        email: `user${Date.now()}@test.com`,
      });
      alert('User created!');
      fetchUsers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create user';
      showError(message);
    } finally {
      setLoading((prev) => ({ ...prev, createUser: false }));
    }
  };

  const fetchUsers = async () => {
    setLoading((prev) => ({ ...prev, users: true }));
    setError(null);
    try {
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch users';
      showError(message);
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  // CQRS Command
  const createPost = async () => {
    if (users.length === 0) {
      alert('Create users first!');
      return;
    }

    setLoading((prev) => ({ ...prev, cqrs: true }));
    setError(null);
    try {
      const data = await apiClient.createPost({
        title: `Post ${Date.now()}`,
        content: 'This is a test post created via CQRS command pattern',
        authorId: users[0].id,
      });
      setCommandResult(data);
      alert('Post created via CQRS!');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create post';
      showError(message);
    } finally {
      setLoading((prev) => ({ ...prev, cqrs: false }));
    }
  };

  // Search
  const searchPosts = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading((prev) => ({ ...prev, search: true }));
    setError(null);
    try {
      const data = await apiClient.searchPosts(query);
      setSearchResults(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to search posts';
      showError(message);
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              🏢 NestJS Enterprise Test Dashboard
            </h1>
            <div className="space-x-4">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Analytics Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      apiClient.logout();
                      setIsAuthenticated(false);
                      window.location.reload();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Login
                  </Link>
                  <Link href="/auth/register" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          <p className="text-gray-600">
            Testing TypeScript, Prisma ORM, CQRS Pattern, Elasticsearch, NestJS Architecture
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Users CRUD (Prisma) */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            👥 Users (Prisma ORM)
          </h2>
          <div className="flex gap-3 mb-4">
            <button
              onClick={createUser}
              disabled={loading.createUser}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading.createUser ? 'Creating...' : 'Create User'}
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading.users}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading.users ? 'Loading...' : 'Fetch Users'}
            </button>
          </div>
          <div className="text-sm text-gray-600 mb-3">
            Total Users: {users.length}
          </div>
          {users.length > 0 && (
            <div className="max-h-64 overflow-auto space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-3 bg-white rounded-md border border-gray-200 text-sm"
                >
                  <span className="font-semibold">{user.name}</span> - {user.email}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CQRS Pattern */}
        <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            ⚡ CQRS Pattern (Command-Query Separation)
          </h2>
          <button
            onClick={createPost}
            disabled={loading.cqrs}
            className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
          >
            {loading.cqrs ? 'Creating...' : 'Create Post (Command)'}
          </button>
          {commandResult && (
            <div className="p-4 bg-white rounded-md border border-gray-200 text-sm">
              <div>
                <strong>Title:</strong> {commandResult.title}
              </div>
              <div>
                <strong>ID:</strong> {commandResult.id}
              </div>
              <div className="text-green-600 mt-2">
                ✓ Command executed successfully
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🔍 Full-Text Search
          </h2>
          <div className="mb-4 flex gap-3">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') searchPosts(searchQuery);
              }}
              className="px-4 py-2.5 w-80 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button
              onClick={() => searchPosts(searchQuery)}
              disabled={loading.search}
              className="px-5 py-2.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading.search ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-64 overflow-auto space-y-2">
              {searchResults.map((post) => (
                <div
                  key={post.id}
                  className="p-3 bg-white rounded-md border border-gray-200 text-sm"
                >
                  <span className="font-semibold">{post.title}</span>
                  <div className="text-gray-600 text-xs mt-1">{post.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GraphQL */}
        <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🔗 GraphQL API
          </h2>
          <div className="text-sm text-gray-600 space-y-3">
            <p>
              <strong>Access GraphQL Playground:</strong>
            </p>
            <a
              href="http://localhost:6000/graphql"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Open GraphQL Playground
            </a>
            <pre className="mt-4 p-4 bg-white rounded-md border border-gray-200 text-xs overflow-auto">
              {`query {
  users {
    id
    name
    email
    posts {
      title
      content
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* NestJS Features */}
        <div className="mb-8 p-6 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🚀 NestJS Features Implemented
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              'Dependency Injection',
              'Modular Architecture',
              'Guards & Interceptors',
              'Pipes & Validation',
              'Exception Filters',
              'Middleware',
              'Prisma ORM Integration',
              'Full-Text Search',
              'GraphQL with Apollo',
              'CQRS Pattern',
              'Event Sourcing',
              'Auto-generated Documentation',
            ].map((feature) => (
              <div
                key={feature}
                className="p-3 bg-white rounded-md border border-gray-200"
              >
                ✅ {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Testing Guide */}
        <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            📝 Testing Guide
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>
              <strong>Prisma:</strong> Type-safe database access with auto-generated
              types
            </li>
            <li>
              <strong>CQRS:</strong> Separate read and write operations for scalability
            </li>
            <li>
              <strong>Search:</strong> Full-text search with fuzzy matching
            </li>
            <li>
              <strong>GraphQL:</strong> Flexible querying with nested relations
            </li>
            <li>
              <strong>TypeScript:</strong> Full type safety with decorators and metadata
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
