/**
 * db/seed.ts
 * Development utility — registers your first test client in the database.
 *
 * Run with:  npx ts-node src/db/seed.ts
 *
 * BEFORE RUNNING:
 *   1. Fill in RETELL_AGENT_ID below with your Retell agent ID.
 *      Find it: Retell dashboard → your agent → Settings.
 *   2. Make sure you've run `npm run db:migrate` first.
 *
 * AFTER RUNNING:
 *   Visit /oauth/square/start?agent_id=<RETELL_AGENT_ID> to connect Square.
 *   The seed only creates the client row — Square tokens arrive via OAuth.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from './index';
import { clients } from './schema';
import { eq } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURE THIS BEFORE RUNNING
//
// RETELL_AGENT_ID: Find it in Retell dashboard → your agent → Settings tab.
//   It looks like: agent_abc123xyz  (NOT your API key which starts with "key_")
// ─────────────────────────────────────────────────────────────────────────────
const RETELL_AGENT_ID = 'agent_04cb403d93c1d6fc57ba9a18a0';
const BUSINESS_NAME = 'Los Cab Sports Village';
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  if ((RETELL_AGENT_ID as string) === 'YOUR_RETELL_AGENT_ID_HERE') {
    console.error('\n[seed] ERROR: Fill in RETELL_AGENT_ID in src/db/seed.ts before running.\n');
    process.exit(1);
  }

  // Check if already seeded.
  const [existing] = await db
    .select()
    .from(clients)
    .where(eq(clients.retellAgentId, RETELL_AGENT_ID));

  if (existing) {
    console.log(`[seed] Client already exists (id=${existing.id}). Nothing to do.`);
    console.log(`[seed] To reconnect Square: GET /oauth/square/start?agent_id=${RETELL_AGENT_ID}`);
    process.exit(0);
  }

  await db.insert(clients)
    .values({
      retellAgentId: RETELL_AGENT_ID,
      businessName: BUSINESS_NAME,
      bookingProvider: 'square',
    });

  console.log(`\n[seed] ✅ Client registered!`);
  console.log(`       Business: ${BUSINESS_NAME}`);
  console.log(`       Agent ID: ${RETELL_AGENT_ID}`);
  console.log(`\n[seed] Next: connect Square by visiting:`);
  console.log(`       http://localhost:3000/oauth/square/start?agent_id=${RETELL_AGENT_ID}\n`);
}

seed().catch(err => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
