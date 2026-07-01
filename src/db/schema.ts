/**
 * db/schema.ts
 * Drizzle ORM table definitions for the Nott AI SQLite database.
 *
 * One row per registered business. Square token columns are nullable so a
 * client record can be created (during OAuth start) before tokens arrive.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  /** The business name (e.g. "Los Cab Sports Village"). */
  businessName: text('business_name').notNull(),

  /** Retell agent ID for this business — our primary lookup key. */
  retellAgentId: text('retell_agent_id').notNull().unique(),

  /** Which booking system this client uses. Currently only 'square'. */
  bookingProvider: text('booking_provider').notNull().default('square'),

  // ─── Square OAuth (populated after OAuth flow) ────────────────────────────
  squareMerchantId: text('square_merchant_id'),
  squareLocationId: text('square_location_id'),
  squareAccessToken: text('square_access_token'),
  squareRefreshToken: text('square_refresh_token'),
  /** Unix timestamp (seconds) when the access token expires. Square tokens last 30 days. */
  squareTokenExpiresAt: integer('square_token_expires_at'),

  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
