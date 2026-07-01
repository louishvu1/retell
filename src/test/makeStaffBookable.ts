import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db';
import { clients } from '../db/schema';
import { createSquareClient } from '../services/square/SquareClient';

const SQUARE_BASE = 'https://connect.squareupsandbox.com';

async function run() {
  const personalToken = process.env.SQUARE_PERSONAL_ACCESS_TOKEN!;
  const [row] = await db.select().from(clients);
  const oauthToken = row!.squareAccessToken!;
  const locationId = row!.squareLocationId!;

  // Use OAuth token for Bookings API (needs APPOINTMENTS_ALL_READ)
  // Use personal token for the PUT update (needs full write access)
  const sq = createSquareClient(oauthToken);

  // List ALL team member booking profiles (including non-bookable)
  console.log('\n── All team member booking profiles ─────────────────');
  const { result } = await sq.bookingsApi.listTeamMemberBookingProfiles(
    false, // bookableOnly = false
    100,
  );

  const profiles = result.teamMemberBookingProfiles ?? [];
  console.log(`Found ${profiles.length} profile(s):\n`);
  profiles.forEach(p => {
    console.log(`  ID: ${p.teamMemberId} | bookable: ${p.isBookable} | display: ${p.displayName}`);
  });

  if (profiles.length === 0) {
    console.log('No profiles found at all.');
    return;
  }

  // Try to make each non-bookable member bookable
  for (const profile of profiles) {
    if (profile.isBookable) {
      console.log(`\n  "${profile.displayName}" is already bookable ✓`);
      continue;
    }

    console.log(`\n  Trying to make "${profile.displayName}" bookable...`);
    const res = await fetch(
      `${SQUARE_BASE}/v2/bookings/team-member-booking-profiles/${profile.teamMemberId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${personalToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18',
        },
        body: JSON.stringify({
          team_member_booking_profile: {
            team_member_id: profile.teamMemberId,
            is_bookable: true,
          },
        }),
      },
    );

    const body = await res.json() as Record<string, unknown>;
    if (res.ok) {
      console.log(`  ✅ Success`);
    } else {
      console.log(`  ❌ Failed (${res.status}):`, JSON.stringify(body));
    }
  }
}

run().catch(err => { console.error(err.message); process.exit(1); });
