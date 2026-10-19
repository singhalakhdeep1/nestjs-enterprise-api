/**
 * Demo seed: an admin, a regular user and a few tagged posts with a comment.
 * Password for both accounts: SEED_PASSWORD (default ChangeMe123!). Safe to re-run.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash(process.env.SEED_PASSWORD || 'ChangeMe123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@enterprise.io' },
    update: {},
    create: { email: 'admin@enterprise.io', name: 'Admin', password, role: 'ADMIN' },
  });
  const user = await prisma.user.upsert({
    where: { email: 'user@enterprise.io' },
    update: {},
    create: { email: 'user@enterprise.io', name: 'Demo User', password },
  });

  if ((await prisma.post.count()) === 0) {
    const samples = [
      { title: 'CQRS in NestJS', content: 'Commands change state, queries read it, events fan out to search and messaging.', tags: ['nestjs', 'cqrs'], authorId: admin.id },
      { title: 'Federated GraphQL', content: 'This API is an Apollo Federation 2 subgraph composed by a gateway.', tags: ['graphql', 'federation'], authorId: admin.id },
      { title: 'Searching with Elasticsearch', content: 'Posts are indexed on every create and update event.', tags: ['elasticsearch', 'search'], authorId: user.id },
    ];
    for (const s of samples) {
      const post = await prisma.post.create({
        data: { title: s.title, content: s.content, authorId: s.authorId, tags: { connectOrCreate: s.tags.map((name) => ({ where: { name }, create: { name } })) } },
      });
      await prisma.comment.create({ data: { postId: post.id, authorId: user.id, content: 'Great write-up!' } });
    }
  }
  console.log('Seeding complete (admin@enterprise.io, user@enterprise.io). Run POST /search/reindex to index posts in Elasticsearch.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
