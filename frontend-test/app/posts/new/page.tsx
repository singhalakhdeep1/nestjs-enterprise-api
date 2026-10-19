'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';

function Editor() {
  const router = useRouter();
  const editId = useSearchParams().get('edit');
  const [form, setForm] = useState({ title: '', content: '', tags: '', published: true });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!apiClient.getToken()) router.push('/auth/login');
    if (editId) {
      apiClient.getPost(editId).then((p) => setForm({ title: p.title, content: p.content, tags: p.tags.map((t) => t.name).join(', '), published: p.published })).catch((e) => setError(e.message));
    }
  }, [editId, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title: form.title, content: form.content, published: form.published, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
    try {
      const post = editId ? await apiClient.updatePost(editId, data) : await apiClient.createPost(data);
      router.push(`/posts/${post.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-3">
      <h1 className="text-xl font-semibold">{editId ? 'Edit post' : 'New post'}</h1>
      <input aria-label="Title" className="w-full rounded border px-3 py-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <textarea aria-label="Content" className="h-48 w-full rounded border px-3 py-2" placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
      <input aria-label="Tags" className="w-full rounded border px-3 py-2" placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published
      </label>
      <button className="rounded bg-blue-600 px-4 py-2 text-white">{editId ? 'Save' : 'Publish'}</button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}

export default function NewPostPage() {
  return <Suspense><Editor /></Suspense>;
}
