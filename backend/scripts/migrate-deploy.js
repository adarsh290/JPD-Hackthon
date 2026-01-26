#!/usr/bin/env node

/**
 * Production database migration script for Render deployment
 * This script runs database migrations in production environment
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = dirname(__dirname);

console.log('🚀 Starting production database migration...');

try {
  // Change to backend directory
  process.chdir(backendDir);
  
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🗄️  Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('✅ Database migration completed successfully!');
} catch (error) {
  console.error('❌ Database migration failed:', error.message);
  process.exit(1);
}