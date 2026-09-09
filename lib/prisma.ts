import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// For Vercel Serverless environment:
// If a cloud database (Postgres/Supabase/Neon/MySQL) is NOT provided, fallback to writable SQLite in /tmp
if (process.env.VERCEL) {
  const currentDbUrl = process.env.DATABASE_URL || '';
  const isRemoteDb = currentDbUrl.startsWith('postgres') || currentDbUrl.startsWith('mysql') || currentDbUrl.startsWith('libsql');

  if (!isRemoteDb) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.join(__dirname, '..', 'prisma', 'dev.db'),
        path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
      ];

      for (const src of candidates) {
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, tmpDbPath);
            break;
          } catch (e) {
            console.error('Failed to copy db to /tmp:', e);
          }
        }
      }
    }
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
