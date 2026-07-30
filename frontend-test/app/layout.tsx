import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NestJS Enterprise Test Dashboard',
  description: 'Test NestJS, Prisma, CQRS, Elasticsearch, GraphQL',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
