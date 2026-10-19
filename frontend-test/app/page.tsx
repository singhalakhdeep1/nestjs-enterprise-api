'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { API_URL, apiClient, type Page, type Post, type SearchResult } from '../lib/api-client';

export default function FeedPage() {
  const [feed, setFeed] = useState<Page<Post> | null>(null);
  const [tags, setTags] = useState<{ name: string; posts: number }[]>([]);
  const [tag, setTag] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [live, setLive] = useState<string[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    apiClient.listPosts({ tag: tag || undefined }).then(setFeed).catch((e) => setError(e.message));
    apiClient.tags().then(setTags).catch(() => undefined);
  }, [tag]);
  useEffect(load, [load]);

  // Live updates: post/comment events fan out via Redis pub/sub to the socket.io gateway.
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'], auth: { token: apiClient.getToken() } });
    socket.on('postUpdate', (m: { event: string; data: { title?: string } }) => {
      setLive((l) => [`${m.event}${m.data?.title ? `: ${m.data.title}` : ''}`, ...l].slice(0, 5));
      load();
    });
    return () => {
      socket.close();
    };
  }, [load]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return setResults(null);
    try {
      setResults(await apiClient.searchPosts(query, tag || undefined));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input aria-label="Search" className="flex-1 rounded border px-3 py-2" placeholder="Search posts (Elasticsearch, fuzzy)" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Tag" className="rounded border px-3 py-2" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">All tags</option>
          {tags.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.posts})</option>)}
        </select>
        <button className="rounded bg-blue-600 px-4 py-2 text-white">Search</button>
      </form>
      {error && <p className="text-red-600">{error}</p>}
      {live.length > 0 && (
        <div className="rounded border border-green-300 bg-green-50 p-3 text-sm" data-testid="live">
          <b>Live:</b> {live.join(' · ')}
        </div>
      )}

      {results && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{results.total} results <span className="text-sm text-gray-500">({results.engine})</span></h2>
          <ul className="space-y-2">
            {results.results.map((r) => (
              <li key={r.id} className="rounded border bg-white p-3">
                <Link href={`/posts/${r.id}`} className="font-medium text-blue-700">{r.title}</Link>
                {r.highlight?.content && <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: r.highlight.content.join(' … ').replace(/<(?!\/?em>)[^>]*>/g, '') }} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h1 className="mb-3 text-xl font-semibold">Latest posts {feed?.cached && <span className="text-xs text-gray-400">(cached)</span>}</h1>
        <ul className="space-y-3">
          {feed?.data.map((p) => (
            <li key={p.id} className="rounded border bg-white p-4" data-testid="post">
              <Link href={`/posts/${p.id}`} className="text-lg font-medium text-blue-700">{p.title}</Link>
              <p className="mt-1 line-clamp-2 text-gray-700">{p.content}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                <span>by {p.author?.name}</span>
                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                <span>{p._count?.comments ?? 0} comments</span>
                {p.tags.map((t) => <span key={t.name} className="rounded bg-gray-100 px-2">#{t.name}</span>)}
              </div>
            </li>
          ))}
        </ul>
        {feed && feed.data.length === 0 && <p className="text-gray-500">No posts yet.</p>}
      </section>
    </div>
  );
}
