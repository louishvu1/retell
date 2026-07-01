/**
 * db/index.ts
 * Opens the SQLite database and exports the typed Drizzle instance.
 *
 * Uses @libsql/client — no native compilation required (works on any Node version).
 *
 * Import `config` before this module so dotenv has run first.
 * In server.ts that order is guaranteed because config is the first import.
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';
import { config } from '../config';

const dbPath = path.resolve(config.DATABASE_PATH);
const dbDir = path.dirname(dbPath);

// Create the data directory if it doesn't exist yet.
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const client = createClient({ url: `file:${dbPath}` });
export const db = drizzle(client, { schema });
