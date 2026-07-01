import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',           // drizzle-kit v0.21+ uses dialect instead of driver
  dbCredentials: {
    url: process.env['DATABASE_PATH'] ?? './data/nott-ai.db',
  },
} satisfies Config;
