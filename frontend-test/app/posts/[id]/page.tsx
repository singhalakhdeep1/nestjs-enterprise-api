'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { API_URL, apiClient, type Post } from '../../../lib/api-client';
import { useAuth } from '../../../lib/use-auth';

export default function PostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    apiClient.getPost(params.id).then(setPost).catch((e) => setError(e.message));
  }, [params.id]);
  useEffect(load, [load]);

  // Join the post's room to receive comment events in real time.
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.emit('joinRoom', `post:${params.id}`);
    socket.on('comment.added', load);
    socket.on('comment.deleted', load);
    socket.on('post.updated', load);
    return () => {
      socket.close();
    };
  }, [params.id, load]);

  if (!post) return <p className={error ? 'text-red-600' : 'text-gray-500'}>{error || 'Loading...'}</p>;
  const canEdit = user && (user.id === post.authorId || user.role === 'ADMIN');

  return (
    <article className="space-y-4">
      <Link href="/" className="text-sm text-blue-600">&larr; Feed</Link>
      <h1 className="text-2xl font-semibold">{post.title}</h1>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span>by {post.author?.name}</span>
        <span>{post.viewCount} views</span>
        {!post.published && <span className="rounded bg-yellow-100 px-2">draft</span>}
        {post.tags.map((t) => <span key={t.name} className="rounded bg-gray-100 px-2">#{t.name}</span>)}
      </div>
      <p className="whitespace-pre-wrap">{post.content}</p>
      {canEdit && (
        <div className="flex gap-2">
          <Link href={`/posts/new?edit=${post.id}`} className="rounded border px-3 py-1 text-sm">Edit</Link>
          <button className="rounded bg-red-600 px-3 py-1 text-sm text-white" onClick={async () => {
            if (!confirm('Delete this post?')) return;
            await apiClient.deletePost(post.id);
            router.push('/');
          }}>Delete</button>
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Comments ({post.comments?.length ?? 0})</h2>
        {post.comments?.map((c) => (
          <div key={c.id} className="rounded border bg-white p-3 text-sm" data-testid="comment">
            <b>{c.author?.name}</b> <span className="text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
            <p>{c.content}</p>
            {user && (user.id === c.authorId || user.role === 'ADMIN') && (
              <button className="text-xs text-red-600" onClick={() => apiClient.deleteComment(c.id).then(load)}>delete</button>
            )}
          </div>
        ))}
        {user ? (
          <form className="flex gap-2" onSubmit={async (e) => {
            e.preventDefault();
            try {
              await apiClient.addComment(post.id, comment);
              setComment('');
              load();
            } catch (err) {
              setError((err as Error).message);
            }
          }}>
            <input aria-label="Comment" className="flex-1 rounded border px-3 py-2" placeholder="Write a comment" value={comment} onChange={(e) => setComment(e.target.value)} required />
            <button className="rounded bg-blue-600 px-4 py-2 text-white">Comment</button>
          </form>
        ) : <p className="text-sm text-gray-500"><Link href="/auth/login" className="text-blue-600">Log in</Link> to comment.</p>}
        {error && <p className="text-red-600">{error}</p>}
      </section>
    </article>
  );
}
