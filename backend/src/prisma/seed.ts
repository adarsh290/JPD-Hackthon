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

  console.log('✅ Created user:', user.email);

  // Create a test hub
  const hub = await prisma.hub.upsert({
    where: { slug: 'test-hub' },
    update: {},
    create: {
      userId: user.id,
      slug: 'test-hub',
      title: 'Test Hub',
    },
  });

  console.log('✅ Created hub:', hub.title);

  // Create test links
  const link1 = await prisma.link.upsert({
    where: { id: 1 },
    update: {},
    create: {
      hubId: hub.id,
      title: 'Google',
      url: 'https://google.com',
      isActive: true,
      priorityScore: 100,
    },
  });

  const link2 = await prisma.link.upsert({
    where: { id: 2 },
    update: {},
    create: {
      hubId: hub.id,
      title: 'GitHub',
      url: 'https://github.com',
      isActive: true,
      priorityScore: 90,
    },
  });

  console.log('✅ Created links:', link1.title, link2.title);

  // Create test rules
  await prisma.rule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      linkId: link1.id,
      type: 'device',
      value: {
        allowed: ['mobile', 'desktop'],
        priority: 'mobile',
      },
    },
  });

  await prisma.rule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      linkId: link2.id,
      type: 'time',
      value: {
        start: '09:00',
        end: '17:00',
        days: [1, 2, 3, 4, 5], // Monday to Friday
      },
    },
  });

  console.log('✅ Created rules');

  // Create some test analytics
  await prisma.analytics.createMany({
    data: [
      {
        hubId: hub.id,
        linkId: null, // Hub visit
        device: 'desktop',
        country: 'US',
      },
      {
        hubId: hub.id,
        linkId: link1.id, // Link click
        device: 'mobile',
        country: 'CA',
      },
      {
        hubId: hub.id,
        linkId: link2.id, // Link click
        device: 'desktop',
        country: 'UK',
      },
    ],
  });

  console.log('✅ Created analytics data');
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