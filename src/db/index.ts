import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const dbPath = './data/blog.db';

// Ensure data directory exists
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Run migrations automatically on startup. Skip during `next build` —
// page-data-collection runs in parallel workers that would race on a
// fresh build-container DB and fail with "table already exists".
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  migrate(db, { migrationsFolder: resolve(process.cwd(), 'drizzle') });
}
