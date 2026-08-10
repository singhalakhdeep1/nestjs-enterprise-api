import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NestJS Enterprise API database...');

  await prisma.user.upsert({
    where: { email: 'admin@enterprise.io' },
    update: {},
    create: {
      email: 'admin@enterprise.io',
      password: '$2b$10$e8W/2s1u9fK1u0h7.x1V3.9y2z3a4b5c6d7e8f9g0h1i2j3k4l5m',
      role: 'ADMIN',
    },
  });

  console.log('Seeding complete for NestJS Enterprise API.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
