// Typed client for the NestJS Enterprise API (REST). Base URL: NEXT_PUBLIC_API_URL (default http://localhost:4000).
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  posts?: Post[];
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: { id: string; name: string };
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  published: boolean;
  authorId: string;
  author?: { id: string; name: string; email: string };
  tags: { name: string }[];
  viewCount: number;
  _count?: { comments: number };
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  cached?: boolean;
}

export interface SearchResult {
  engine: 'elasticsearch' | 'database';
  total: number;
  results: { id: string; title: string; content: string; tags: string[]; authorName?: string; highlight?: Record<string, string[]> }[];
  tags: { tag: string; count: number }[];
}

export interface AuthResponse {
  access_token: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface PostInput {
  title: string;
  content: string;
  tags?: string[];
  published?: boolean;
}

class ApiClient {
  private token: string | null = null;

  constructor(private baseUrl: string = API_URL) {
    if (typeof window !== 'undefined') this.token = localStorage.getItem('token');
  }

  getToken() {
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          ...options.headers,
        },
      });
    } catch (error) {
      throw new ApiError(error instanceof Error ? error.message : 'Network error occurred');
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) this.clearToken();
      const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      throw new ApiError(msg || `HTTP error! status: ${response.status}`, response.status, data);
    }
    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    this.setToken(res.access_token);
    return res;
  }

  async register(name: string, email: string, password: string) {
    const res = await this.request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    this.setToken(res.access_token);
    return res;
  }

  getProfile() {
    return this.request<User>('/auth/profile');
  }

  logout() {
    this.clearToken();
  }

  // Users
  getUsers(page = 1) {
    return this.request<Page<User>>(`/users?page=${page}&limit=50`);
  }

  // Posts (CQRS commands/queries behind REST)
  listPosts(params: { page?: number; tag?: string; authorId?: string } = {}) {
    const qs = new URLSearchParams({ page: String(params.page ?? 1), limit: '20' });
    if (params.tag) qs.set('tag', params.tag);
    if (params.authorId) qs.set('authorId', params.authorId);
    return this.request<Page<Post>>(`/posts?${qs}`);
  }

  getPost(id: string) {
    return this.request<Post>(`/posts/${id}`);
  }

  createPost(data: PostInput) {
    return this.request<Post>('/posts', { method: 'POST', body: JSON.stringify(data) });
  }

  updatePost(id: string, data: Partial<PostInput>) {
    return this.request<Post>(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deletePost(id: string) {
    return this.request<{ deleted: boolean }>(`/posts/${id}`, { method: 'DELETE' });
  }

  addComment(postId: string, content: string) {
    return this.request<Comment>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  deleteComment(commentId: string) {
    return this.request<{ deleted: boolean }>(`/posts/comments/${commentId}`, { method: 'DELETE' });
  }

  tags() {
    return this.request<{ name: string; posts: number }[]>('/posts/tags');
  }

  // Search
  searchPosts(query: string, tag?: string) {
    return this.request<SearchResult>(`/search?q=${encodeURIComponent(query)}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`);
  }

  // Monitoring
  health() {
    return this.request<{ status: string; dependencies: Record<string, string> }>('/monitoring/health');
  }

  integrations() {
    return this.request<{ integrations: Record<string, string | boolean> }>('/integrations/status');
  }
}

export const apiClient = new ApiClient();
