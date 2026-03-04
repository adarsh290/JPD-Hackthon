import { PrismaClient } from './node_modules/.prisma/client/index.js';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'demo@example.com';
    const password = 'Password@123';

    console.log('Creating test user...');
    const hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash: hash },
        create: {
            email,
            passwordHash: hash,
            displayName: 'Demo User'
        }
    });

    console.log('✅ Test User created successfully');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((e) => {
        console.error('Error creating user:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
