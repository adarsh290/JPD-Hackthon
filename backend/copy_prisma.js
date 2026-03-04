const fs = require('fs');
const path = require('path');

try {
    const src = path.join(__dirname, 'node_modules', '.prisma', 'client');
    const dest = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');

    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log('Successfully copied Prisma client from backend to root workspace!');
} catch (e) {
    console.error('Failed to copy', e);
}
