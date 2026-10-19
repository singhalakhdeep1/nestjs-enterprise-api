import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'NestJS Enterprise API',
  description: 'Test dashboard for the NestJS Enterprise API',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold">Enterprise API</Link>
            <Link href="/" className="text-blue-600">Feed</Link>
            <Link href="/posts/new" className="text-blue-600">New post</Link>
            <Link href="/dashboard" className="text-blue-600">Dashboard</Link>
            <span className="ml-auto" />
            <Link href="/auth/login" className="text-blue-600">Login</Link>
            <Link href="/auth/register" className="text-blue-600">Register</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
