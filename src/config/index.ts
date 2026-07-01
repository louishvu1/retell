/**
 * config/index.ts
 * Reads and validates all environment variables at startup using Zod.
 * The app exits with a clear error message if any required variable is missing.
 * Import this module first in server.ts so dotenv runs before anything else.
 */

import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file into process.env before validation.
dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z
    .string()
    .default('3000')
    .transform(Number),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Public URL — required for Square OAuth redirect URI and ngrok in dev
  APP_BASE_URL: z
    .string()
    .url('APP_BASE_URL must be a valid HTTPS URL (e.g. https://abc.ngrok.io)'),

  // Retell — API key is used for both API calls and webhook signature verification
  RETELL_API_KEY: z.string().min(1, 'RETELL_API_KEY is required'),

  // Square OAuth credentials
  SQUARE_APPLICATION_ID: z.string().min(1, 'SQUARE_APPLICATION_ID is required'),
  SQUARE_APPLICATION_SECRET: z.string().min(1, 'SQUARE_APPLICATION_SECRET is required'),
  SQUARE_ENVIRONMENT: z
    .enum(['sandbox', 'production'])
    .default('sandbox'),

  // Database
  DATABASE_PATH: z.string().default('./data/nott-ai.db'),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map(e => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    console.error(`\n[config] Missing or invalid environment variables:\n${errors}\n`);
    console.error('[config] Copy .env.example to .env and fill in all required values.\n');
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
