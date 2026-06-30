# TODO

Legend: ⬜ not started | 🔄 in progress | ✅ done | ❌ blocked

---

## Milestone 0 — Foundation ✅

- ✅ Project structure and config files
- ✅ Source file stubs with responsibility comments
- ✅ Shared types (booking, retell, client, errors)
- ✅ Full project documentation

---

## Milestone 1 — Local Development 🔄

**Retell → localhost → Square Sandbox**

- ⬜ `npm install`
- ⬜ Fill in `.env` (Square + Retell credentials)
- ⬜ Read Retell webhook docs → confirm payload format + signature verification
- ⬜ `src/config/index.ts` — env validation (Zod)
- ⬜ `src/db/schema.ts` — clients table
- ⬜ `src/db/index.ts` — SQLite connection
- ⬜ `src/db/migrate.ts` — migration runner → `npm run db:migrate`
- ⬜ `src/services/clients/ClientRegistry.ts`
- ⬜ `src/services/square/SquareOAuthService.ts`
- ⬜ `src/routes/oauth.routes.ts` — OAuth start + callback
- ⬜ `src/services/square/SquareClient.ts`
- ⬜ `src/services/booking/providers/SquareBookingAdapter.ts`
  - ⬜ `listServices()` — Square Catalog API
  - ⬜ `listStaff()` — Square Team API
  - ⬜ `getAvailability()` — Square Bookings API
  - ⬜ `createBooking()` — Square Bookings + Customers API
- ⬜ `src/services/booking/BookingRouter.ts`
- ⬜ `src/services/retell/RetellFunctionHandler.ts`
- ⬜ `src/routes/retell.routes.ts` — webhook + signature verification
- ⬜ `src/server.ts` — assemble app
- ⬜ `src/utils/logger.ts`
- ⬜ `src/utils/fuzzyMatch.ts`
- ⬜ `src/db/seed.ts` — register first test client
- ⬜ End-to-end test: booking confirmed in Square sandbox ✓

---

## Milestone 2 — Deploy to Railway

- ⬜ Create GitHub repo and push code
- ⬜ Create Railway project, connect to GitHub repo
- ⬜ Set all env vars in Railway dashboard
- ⬜ Configure persistent volume for SQLite (`/data/nott-ai.db`)
- ⬜ Confirm `/health` returns 200 from public URL

---

## Milestone 3 — Point Retell at Railway

- ⬜ Update Retell agent webhook URL to Railway URL
- ⬜ Re-run Square OAuth against production server
- ⬜ Register production client in Railway database

---

## Milestone 4 — Production Testing

- ⬜ 5 successful test calls end-to-end
- ⬜ Test unavailable staff → agent offers alternatives
- ⬜ Test fully booked slot → agent handles gracefully
- ⬜ Test fuzzy name matching ("Sarah" → "Sarah Johnson")
- ⬜ Confirm Square token auto-refresh works

---

## Milestone 4.5 — Multi-Client Readiness

- ⬜ Audit codebase for any hardcoded client assumptions
- ⬜ Verify `ClientRegistry` isolates clients correctly by `agent_id`
- ⬜ Verify `SquareBookingAdapter` never mixes credentials across clients
- ⬜ Onboard second test business (second Retell agent + second Square sandbox account) — zero code changes
- ⬜ Run both clients simultaneously; confirm calls route to correct Square account
- ⬜ Document the onboarding steps so it can be handed to a non-developer

---

## Parking Lot (post-MVP)

- Cancellations and rescheduling via voice
- SMS/email booking confirmations
- Multi-client onboarding
- Switch Square sandbox → production
- Multi-location support
- Admin dashboard / analytics / billing
