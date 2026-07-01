/**
 * src/test/webhookTest.ts
 * Simulates Retell function calls against your live webhook.
 *
 * Run with:  npx ts-node src/test/webhookTest.ts
 *
 * What it tests:
 *   1. get_services   → lists real services from your Square sandbox
 *   2. get_staff      → lists real bookable staff
 *   3. check_availability → checks real availability for tomorrow
 *   4. create_booking → creates a real test booking (sandboxed, safe to delete)
 *
 * Requires your server to be running on localhost:3000.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createHmac } from 'crypto';

// ── Config ────────────────────────────────────────────────────────────────────
const RETELL_API_KEY = process.env.RETELL_API_KEY!;
const AGENT_ID = 'agent_04cb403d93c1d6fc57ba9a18a0';
const WEBHOOK_URL = 'http://localhost:3000/webhook/retell';
const CALL_ID = `test_call_${Date.now()}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sign a request body exactly how Retell does. */
function sign(body: string): string {
  const timestamp = Date.now();
  const digest = createHmac('sha256', RETELL_API_KEY)
    .update(body + timestamp)
    .digest('hex');
  return `v=${timestamp},d=${digest}`;
}

/** POST one function call to our webhook and return the parsed response. */
async function callFunction(
  name: string,
  args: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const payload = {
    name,
    args,
    call: { call_id: CALL_ID, agent_id: AGENT_ID },
  };

  const body = JSON.stringify(payload);
  const signature = sign(body);

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-retell-signature': signature,
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return JSON.parse(text) as Record<string, unknown>;
}

// ── Test flow ─────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🧪 Nott AI — Webhook Integration Test');
  console.log(`   Call ID  : ${CALL_ID}`);
  console.log(`   Agent ID : ${AGENT_ID}`);
  console.log(`   Target   : ${WEBHOOK_URL}\n`);

  // ── 1. get_services ────────────────────────────────────────────────────────
  console.log('── Step 1: get_services ─────────────────────────────────────');
  const servicesRes = await callFunction('get_services');
  const services = (servicesRes.services ?? []) as Array<{
    id: string; name: string; durationMinutes: number; priceCents: number;
  }>;

  if (services.length === 0) {
    console.log('❌ No services found in Square sandbox.');
    console.log('   Add an Appointments service in your Square sandbox dashboard first.');
    return;
  }

  services.forEach(s =>
    console.log(`   ✓ ${s.name} — ${s.durationMinutes} min — $${(s.priceCents / 100).toFixed(2)} (id: ${s.id})`),
  );

  const service = services[0];
  console.log(`\n   → Using: "${service.name}"\n`);

  // ── 2. get_staff ───────────────────────────────────────────────────────────
  console.log('── Step 2: get_staff ────────────────────────────────────────');
  const staffRes = await callFunction('get_staff');
  const staff = (staffRes.staff ?? []) as Array<{ id: string; name: string }>;

  let staffMember: { id: string; name: string };

  if (staff.length === 0) {
    // Square sandbox doesn't expose non-bookable staff via the Bookings API.
    // Fall back to the known team member ID created by squareSetup.ts.
    console.log('   ⚠️  No bookable staff via API — using Alex Coach (hardcoded sandbox fallback)');
    staffMember = { id: 'TMEGgwIxu44ak8oK', name: 'Alex Coach' };
  } else {
    staff.forEach(s => console.log(`   ✓ ${s.name} (id: ${s.id})`));
    staffMember = staff[0]!;
  }

  console.log(`\n   → Using: "${staffMember.name}"\n`);

  // ── 3. check_availability ──────────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const preferredDate = tomorrow.toISOString().split('T')[0]!;

  console.log(`── Step 3: check_availability (${preferredDate}) ──────────────`);
  // Try without staff filter first — lets Square return any available staff.
  const availRes = await callFunction('check_availability', {
    service_id: service.id,
    preferred_date: preferredDate,
  });

  const slots = (availRes.available_slots ?? []) as Array<{
    startTime: string; staffName: string;
  }>;

  let slotStartTime: string;

  if (slots.length === 0) {
    // No availability found — hardcode a future slot to test create_booking directly.
    slotStartTime = `${preferredDate}T10:00:00Z`;
    console.log(`   ⚠️  No availability returned — using hardcoded slot: ${slotStartTime}`);
    console.log('   (Square may reject this if no staff hours are configured — that\'s expected)\n');
  } else {
    slots.slice(0, 5).forEach(s =>
      console.log(`   ✓ ${s.startTime} with ${s.staffName}`),
    );
    if (slots.length > 5) console.log(`   ... and ${slots.length - 5} more`);
    slotStartTime = slots[0]!.startTime;
    console.log(`\n   → Using slot: ${slotStartTime}\n`);
  }

  // ── 4. create_booking ──────────────────────────────────────────────────────
  console.log('── Step 4: create_booking ───────────────────────────────────');
  console.log('   (This creates a real booking in your Square sandbox — safe to delete)\n');

  const bookingRes = await callFunction('create_booking', {
    service_id: service.id,
    staff_id: staffMember.id,
    start_time: slotStartTime,
    customer_name: 'Test Customer',
    customer_phone: '+15551234567',
    customer_email: 'test@example.com',
  });

  if (bookingRes.error) {
    console.log(`❌ Booking failed: ${bookingRes.error}`);
    return;
  }

  const conf = bookingRes.confirmation as Record<string, unknown> | undefined;
  console.log(`   ✅ Booking confirmed!`);
  console.log(`   Booking ID : ${conf?.bookingId ?? 'unknown'}`);
  console.log(`   Staff      : ${conf?.staffName ?? staffMember.name}`);
  console.log(`   Start time : ${conf?.startTime ?? slot.startTime}`);
  console.log(`\n🎉 Milestone 1 complete! Check Square sandbox → Appointments to see the booking.\n`);
}

run().catch(err => {
  console.error('\n❌ Test error:', err.message);
  process.exit(1);
});
