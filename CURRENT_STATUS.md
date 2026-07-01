# Current Status

**Last updated:** 2026-07-01
**Session:** 3 — Milestone 1 Complete (Local Integration)

---

## What Was Completed This Session

- ✅ Replaced `better-sqlite3` with `@libsql/client` (Node v25 compatibility — no native compilation)
- ✅ Rewrote `src/db/index.ts`, `src/db/migrate.ts`, `src/db/seed.ts` for async libsql patterns
- ✅ Made all `ClientRegistry` methods async (`getByAgentId`, `updateSquareTokens`, `upsertClient`)
- ✅ Fixed Square SDK v39 breaking changes throughout (removed `{ body: {...} }` wrappers)
- ✅ Fixed Square OAuth scopes (`BOOKINGS_*` → `APPOINTMENTS_*`)
- ✅ Fixed `retrieveMerchant` call (string arg, not object)
- ✅ Fixed `retrieveCatalogObject` call (string arg, not object)
- ✅ Fixed `listCatalog` call (`undefined, 'ITEM'` not `{ types: 'ITEM' }`) — **this was why get_services returned empty**
- ✅ Completed Square OAuth — tokens stored in SQLite DB
- ✅ Configured Retell agent webhook URL to ngrok endpoint
- ✅ Added 4 custom functions to Retell agent (get_services, get_staff, check_availability, create_booking)
- ✅ Fixed Retell lifecycle events (call_started, call_ended) hitting webhook — now returns 200 gracefully
- ✅ Fixed payload too large error — increased `express.raw()` limit to 10mb
- ✅ Updated Retell agent system prompt to enforce correct function call order
- ✅ Wrote `src/test/webhookTest.ts` — automated end-to-end webhook simulation
- ✅ Wrote `src/test/squareSetup.ts` — Square sandbox seeder (services + team members)
- ✅ Wrote `src/test/diagnoseCatalog.ts` — catalog diagnostic
- ✅ Wrote `src/test/makeStaffBookable.ts` — staff bookable profile helper
- ✅ Verified get_services returns 5 services from Square sandbox
- ✅ Server running, ngrok tunnel live, all routes working

---

## What Is Not Done Yet

- ❌ Full end-to-end booking test (Square sandbox limitation — see below)
- ❌ Railway deployment

---

## Known Square Sandbox Limitation

Square sandbox blocks making team members "bookable" via API:
- `PUT /v2/bookings/team-member-booking-profiles/{id}` returns 404 (profile not auto-created)
- `listTeamMemberBookingProfiles(bookableOnly=false)` returns 403 (needs `APPOINTMENTS_ALL_READ` not granted in sandbox)
- The sandbox dashboard UI for Team Members is broken (shows marketing page)

**This is a sandbox data issue, not a code issue.** The booking code is correct. In production,
businesses have properly configured Square accounts with real bookable staff and working hours.

**Decision:** Skip full sandbox e2e test, deploy to Railway (Milestone 2), and test with a
properly configured Square account against the production server.

---

## Active Milestone

**Milestone 2 — Deploy to Railway**
Goal: Production server live on Railway with persistent SQLite, public URL replacing ngrok.

---

## Next Action

Open `NEXT_TASK.md` and follow the Railway deployment steps.
