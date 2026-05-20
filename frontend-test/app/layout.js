export const metadata = {
    title: 'NestJS Enterprise Test Dashboard',
    description: 'Test NestJS, Prisma, CQRS, Elasticsearch, GraphQL',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body style={{ margin: 0, padding: 0 }}>{children}</body>
        </html>
    );
}
