/**
 * db/migrate.ts
 * Standalone migration runner — called by `npm run db:migrate`.
 *
 * Applies any pending SQL migrations from src/db/migrations/ to the SQLite
 * database. Run this whenever you change db/schema.ts.
 *
 * Workflow:
 *   1. npm run db:generate   ← generates SQL files in src/db/migrations/
 *   2. npm run db:migrate    ← applies them (this file)
 */

import * as dotenv from 'dotenv';
dotenv.config(); // Must run before config is imported

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const dbPath = path.resolve(config.DATABASE_PATH);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`[migrate] Database: ${dbPath}`);

async function main() {
  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client);

  await migrate(db, {
    migrationsFolder: path.join(__dirname, 'migrations'),
  });

  console.log('[migrate] All migrations applied successfully.');
  client.close();
}

main().catch(err => {
  console.error('[migrate] Migration failed:', err);
  process.exit(1);
});
