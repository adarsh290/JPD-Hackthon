import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test user
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash,
      displayName: 'Test User',
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create a test hub
  const hub = await prisma.linkHub.upsert({
    where: { slug: 'demo-hub' },
    update: {},
    create: {
      userId: user.id,
      name: 'Demo Hub',
      slug: 'demo-hub',
      description: 'A demo link hub',
      isActive: true,
    },
  });

  console.log('✅ Created demo hub:', hub.slug);

  // Create test links
  const links = await Promise.all([
    prisma.link.upsert({
      where: { id: 'link-1' },
      update: {},
      create: {
        id: 'link-1',
        hubId: hub.id,
        title: 'Example Link 1',
        url: 'https://example.com',
        icon: '🔗',
        position: 0,
        isActive: true,
      },
    }),
    prisma.link.upsert({
      where: { id: 'link-2' },
      update: {},
      create: {
        id: 'link-2',
        hubId: hub.id,
        title: 'Example Link 2',
        url: 'https://example.org',
        icon: '⭐',
        position: 1,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created', links.length, 'test links');

  // Create a rule for the first link
  await prisma.rule.upsert({
    where: { linkId: links[0].id },
    update: {},
    create: {
      linkId: links[0].id,
      deviceRules: {
        allowed: ['mobile', 'desktop'],
        priority: 'mobile',
      },
      performanceRules: {
        autoSort: true,
        priority: 'high',
      },
    },
  });

  console.log('✅ Created rule for first link');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
