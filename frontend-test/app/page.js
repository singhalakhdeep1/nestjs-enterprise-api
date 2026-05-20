'use client';

import { useState } from 'react';

export default function NestJSTestDashboard() {
    const [users, setUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [commandResult, setCommandResult] = useState(null);
    const [loading, setLoading] = useState({});

    const BASE_URL = 'http://localhost:6000';

    // CRUD Operations
    const createUser = async () => {
        setLoading(prev => ({ ...prev, createUser: true }));
        try {
            const res = await fetch(`${BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `User ${Date.now()}`,
                    email: `user${Date.now()}@test.com`
                })
            });
            const data = await res.json();
            alert('User created!');
            fetchUsers();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(prev => ({ ...prev, createUser: false }));
        }
    };

    const fetchUsers = async () => {
        setLoading(prev => ({ ...prev, users: true }));
        try {
            const res = await fetch(`${BASE_URL}/users`);
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(prev => ({ ...prev, users: false }));
        }
    };

    // CQRS Command
    const createPost = async () => {
        if (users.length === 0) {
            alert('Create users first!');
            return;
        }

        setLoading(prev => ({ ...prev, cqrs: true }));
        try {
            const res = await fetch(`${BASE_URL}/cqrs/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Post ${Date.now()}`,
                    content: 'This is a test post created via CQRS command pattern',
                    authorId: users[0].id
                })
            });
            const data = await res.json();
            setCommandResult(data);
            alert('Post created via CQRS!');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(prev => ({ ...prev, cqrs: false }));
        }
    };

    // Elasticsearch Search
    const searchPosts = async (query) => {
        setLoading(prev => ({ ...prev, search: true }));
        try {
            const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>🏢 NestJS Enterprise Test Dashboard</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                Testing TypeScript, Prisma ORM, CQRS Pattern, Elasticsearch, NestJS Architecture
            </p>

            {/* Users CRUD (Prisma) */}
            <div style={{ marginBottom: '30px', padding: '20px', background: '#eff6ff', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>👥 Users (Prisma ORM)</h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button
                        onClick={createUser}
                        disabled={loading.createUser}
                        style={{
                            padding: '10px 20px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading.createUser ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading.createUser ? 'Creating...' : 'Create User'}
                    </button>
                    <button
                        onClick={fetchUsers}
                        disabled={loading.users}
                        style={{
                            padding: '10px 20px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading.users ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading.users ? 'Loading...' : 'Fetch Users'}
                    </button>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Users: {users.length}</div>
                {users.length > 0 && (
                    <div style={{ marginTop: '10px', maxHeight: '200px', overflow: 'auto' }}>
                        {users.map(user => (
                            <div key={user.id} style={{
                                padding: '10px',
                                background: 'white',
                                marginBottom: '8px',
                                borderRadius: '6px',
                                fontSize: '13px'
                            }}>
                                <strong>{user.name}</strong> - {user.email}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CQRS Pattern */}
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f0fdf4', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>⚡ CQRS Pattern (Command-Query Separation)</h2>
                <button
                    onClick={createPost}
                    disabled={loading.cqrs}
                    style={{
                        padding: '10px 20px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading.cqrs ? 'not-allowed' : 'pointer',
                        marginBottom: '15px'
                    }}
                >
                    {loading.cqrs ? 'Creating...' : 'Create Post (Command)'}
                </button>
                {commandResult && (
                    <div style={{ padding: '15px', background: 'white', borderRadius: '6px', fontSize: '14px' }}>
                        <div><strong>Title:</strong> {commandResult.title}</div>
                        <div><strong>ID:</strong> {commandResult.id}</div>
                        <div style={{ color: '#10b981', marginTop: '5px' }}>✓ Command executed successfully</div>
                    </div>
                )}
            </div>

            {/* Elasticsearch */}
            <div style={{ marginBottom: '30px', padding: '20px', background: '#fef3c7', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>🔍 Elasticsearch Full-Text Search</h2>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Search posts..."
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') searchPosts(e.target.value);
                        }}
                        style={{
                            padding: '10px',
                            width: '300px',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            marginRight: '10px'
                        }}
                    />
                    <button
                        onClick={(e) => {
                            const input = e.target.previousSibling;
                            searchPosts(input.value);
                        }}
                        disabled={loading.search}
                        style={{
                            padding: '10px 20px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading.search ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading.search ? 'Searching...' : 'Search'}
                    </button>
                </div>
                {searchResults.length > 0 && (
                    <div style={{ marginTop: '10px', maxHeight: '200px', overflow: 'auto' }}>
                        {searchResults.map(post => (
                            <div key={post.id} style={{
                                padding: '10px',
                                background: 'white',
                                marginBottom: '8px',
                                borderRadius: '6px',
                                fontSize: '13px'
                            }}>
                                <strong>{post.title}</strong>
                                <div style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
                                    {post.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* GraphQL */}
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f3e8ff', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>🔗 GraphQL API</h2>
                <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
                    <p><strong>Access GraphQL Playground:</strong></p>
                    <a
                        href="http://localhost:6000/graphql"
                        target="_blank"
                        style={{
                            display: 'inline-block',
                            marginTop: '10px',
                            padding: '10px 20px',
                            background: '#8b5cf6',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '6px'
                        }}
                    >
                        Open GraphQL Playground
                    </a>
                    <pre style={{
                        marginTop: '15px',
                        padding: '15px',
                        background: 'white',
                        borderRadius: '6px',
                        fontSize: '12px'
                    }}>
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
            <div style={{ marginBottom: '30px', padding: '20px', background: '#fee2e2', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>🚀 NestJS Features Implemented</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Dependency Injection
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Modular Architecture
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Guards & Interceptors
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Pipes & Validation
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Exception Filters
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Middleware
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Prisma ORM Integration
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Elasticsearch Integration
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ GraphQL with Apollo
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ CQRS Pattern
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Event Sourcing
                    </div>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                        ✅ Swagger Documentation
                    </div>
                </div>
            </div>

            {/* Testing Guide */}
            <div style={{ marginTop: '40px', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>📝 Testing Guide</h3>
                <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151' }}>
                    <li><strong>Prisma:</strong> Type-safe database access with auto-generated types</li>
                    <li><strong>CQRS:</strong> Separate read and write operations for scalability</li>
                    <li><strong>Elasticsearch:</strong> Full-text search with fuzzy matching</li>
                    <li><strong>GraphQL:</strong> Flexible querying with nested relations</li>
                    <li><strong>Swagger:</strong> Visit <code>http://localhost:6000/api</code> for API docs</li>
                    <li><strong>TypeScript:</strong> Full type safety with decorators and metadata</li>
                </ul>
            </div>
        </div>
    );
}
