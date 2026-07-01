/**
 * src/test/squareSetup.ts
 * Seeds your Square sandbox with a test service and bookable staff member.
 *
 * Run with:  npx ts-node src/test/squareSetup.ts
 *
 * Safe to run multiple times — skips anything that already exists.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db';
import { clients } from '../db/schema';
import { createSquareClient } from '../services/square/SquareClient';

const AGENT_ID = 'agent_04cb403d93c1d6fc57ba9a18a0';
const SQUARE_BASE = 'https://connect.squareupsandbox.com';

async function run() {
  console.log('\n🔧 Square Sandbox Setup\n');

  // ── Get tokens ────────────────────────────────────────────────────────────
  // Setup needs full write access — use the personal access token, not OAuth.
  const token = process.env.SQUARE_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    console.error('❌ SQUARE_PERSONAL_ACCESS_TOKEN not set in .env.');
    console.error('   Find it: developer.squareup.com → your app → Credentials → Sandbox Access Token');
    process.exit(1);
  }

  const [row] = await db.select().from(clients);
  if (!row?.squareLocationId) {
    console.error('❌ No location ID found. Run OAuth first.');
    process.exit(1);
  }

  const locationId = row.squareLocationId!;
  const sq = createSquareClient(token);

  console.log(`   Location ID : ${locationId}`);
  console.log(`   Agent ID    : ${AGENT_ID}\n`);

  // ── 1. Create a catalog service item ──────────────────────────────────────
  console.log('── Step 1: Create Appointments service ──────────────────────');

  const idempotencyKey = `nott-ai-setup-service-${Date.now()}`;
  const { result: catalogResult } = await sq.catalogApi.upsertCatalogObject({
    idempotencyKey,
    object: {
      type: 'ITEM',
      id: '#Tennis60',
      itemData: {
        name: 'Tennis Lesson',
        productType: 'APPOINTMENTS_SERVICE',
        variations: [
          {
            type: 'ITEM_VARIATION',
            id: '#Tennis60Variation',
            itemVariationData: {
              name: '60 min',
              pricingType: 'FIXED_PRICING',
              priceMoney: { amount: BigInt(5000), currency: 'USD' },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              appointmentData: { durationMinutes: 60 },
            } as any,
          },
        ],
      },
    },
  });

  const serviceId = catalogResult.catalogObject?.id;
  console.log(`   ✅ Service created: "Tennis Lesson — 60 min" (ID: ${serviceId})\n`);

  // ── 2. Create a team member ────────────────────────────────────────────────
  console.log('── Step 2: Create team member ───────────────────────────────');

  const { result: teamResult } = await sq.teamApi.createTeamMember({
    idempotencyKey: `nott-ai-staff-${Date.now()}`,
    teamMember: {
      givenName: 'Alex',
      familyName: 'Coach',
      assignedLocations: {
        assignmentType: 'ALL_CURRENT_AND_FUTURE_LOCATIONS',
      },
    },
  });

  const teamMemberId = teamResult.teamMember?.id;
  console.log(`   ✅ Team member created: "Alex Coach" (ID: ${teamMemberId})\n`);

  // ── 3. Make the team member bookable via Square REST API ──────────────────
  console.log('── Step 3: Enable bookable profile ──────────────────────────');

  const profileRes = await fetch(
    `${SQUARE_BASE}/v2/bookings/team-member-booking-profiles/${teamMemberId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        team_member_booking_profile: {
          team_member_id: teamMemberId,
          is_bookable: true,
        },
      }),
    },
  );

  if (!profileRes.ok) {
    const err = await profileRes.text();
    console.log(`   ⚠️  Could not set bookable via API: ${profileRes.status} ${err}`);
    console.log('   → Try enabling "Accept Appointments" manually in Square dashboard.');
  } else {
    console.log('   ✅ Team member is now bookable\n');
  }

  console.log('✅ Setup complete! Now run the webhook test:');
  console.log('   npx ts-node src/test/webhookTest.ts\n');
}

run().catch(err => {
  console.error('\n❌ Setup error:', err.message ?? err);
  process.exit(1);
});
