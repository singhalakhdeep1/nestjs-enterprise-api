'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, type Page, type Post, type User } from '../../lib/api-client';
import { useAuth } from '../../lib/use-auth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [mine, setMine] = useState<Page<Post> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [health, setHealth] = useState<{ status: string; dependencies: Record<string, string> } | null>(null);
  const [integrations, setIntegrations] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    if (ready && !user) router.push('/auth/login');
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    apiClient.listPosts({ authorId: user.id }).then(setMine).catch(() => undefined);
    apiClient.getUsers().then((r) => setUsers(r.data)).catch(() => undefined);
    apiClient.health().then(setHealth).catch(() => undefined);
    apiClient.integrations().then((r) => setIntegrations(r.integrations)).catch(() => undefined);
  }, [user]);

  if (!user) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Welcome, {user.name} <span className="text-sm text-gray-500">({user.role})</span></h1>
        <button className="rounded border px-3 py-1 text-sm" onClick={() => { logout(); router.push('/'); }}>Log out</button>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">My posts ({mine?.meta.total ?? 0})</h2>
        <ul className="space-y-2">
          {mine?.data.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded border bg-white p-3">
              <Link href={`/posts/${p.id}`} className="text-blue-700">{p.title}</Link>
              <span className="text-xs text-gray-500">{p.published ? 'published' : 'draft'} · {p.viewCount} views</span>
            </li>
          ))}
        </ul>
        <Link href="/posts/new" className="mt-2 inline-block text-sm text-blue-600">+ New post</Link>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">System health {health && <span className="text-sm text-gray-500">({health.status})</span>}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" data-testid="health">
          {health && Object.entries(health.dependencies).map(([k, v]) => (
            <div key={k} className="rounded border bg-white p-2 text-sm"><b>{k}</b><div className={v === 'connected' ? 'text-green-600' : v === 'disabled' ? 'text-gray-400' : 'text-red-600'}>{v}</div></div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {Object.entries(integrations).map(([k, v]) => <span key={k} className="rounded bg-gray-100 px-2 py-1">{k}: {String(v)}</span>)}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Users</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {users.map((u) => <li key={u.id} className="rounded border bg-white p-2 text-sm">{u.name} <span className="text-gray-500">{u.email}</span> {u.role === 'ADMIN' && <span className="rounded bg-blue-100 px-1 text-xs">admin</span>}</li>)}
        </ul>
      </section>
    </div>
  );
}
