# TODO

Legend: ⬜ not started | 🔄 in progress | ✅ done | ❌ blocked

---

## Milestone 0 — Foundation ✅

- ✅ Project structure and config files
- ✅ Source file stubs with responsibility comments
- ✅ Shared types (booking, retell, client, errors)
- ✅ Full project documentation

---

## Milestone 1 — Local Development ✅

**Retell → localhost → Square Sandbox**

- ✅ `npm install`
- ✅ Fill in `.env` (Square + Retell credentials)
- ✅ `npm run db:generate` + `npm run db:migrate`
- ✅ `src/db/seed.ts` — registered Los Cab Sports Village (agent_04cb403d93c1d6fc57ba9a18a0)
- ✅ ngrok tunnel live (facing-skyward-greedily.ngrok-free.dev)
- ✅ Square OAuth complete — tokens in SQLite DB
- ✅ Retell agent webhook URL configured
- ✅ Retell agent functions configured (get_services, get_staff, check_availability, create_booking)
- ✅ Retell agent system prompt updated (enforces correct function call order)
- ✅ get_services working (listCatalog bug fixed)
- ✅ check_availability working (confirmed in live call logs)
- ⬜ Full e2e booking confirmed in Square sandbox
  → SKIPPED: Square sandbox blocks bookable staff via API. Code is correct.
  → Will validate on Railway with properly configured Square account.

---

## Milestone 2 — Deploy to Railway 🔄

- ⬜ Push code to GitHub
- ⬜ Create Railway project, connect to GitHub repo
- ⬜ Set all env vars in Railway dashboard
- ⬜ Add persistent volume for SQLite (`/data/nott-ai.db`)
- ⬜ Confirm `/health` returns 200 from Railway URL
- ⬜ Update APP_BASE_URL in Railway to the Railway URL
- ⬜ Update Square OAuth redirect URL in Square Developer dashboard
- ⬜ Re-run Square OAuth against Railway URL
- ⬜ Update Retell webhook URL to Railway URL
- ⬜ Run a real test call — confirm logs appear in Railway

---

## Milestone 3 — Production Testing

- ⬜ 5 successful test calls end-to-end
- ⬜ Test unavailable staff → agent offers alternatives
- ⬜ Test fully booked slot → agent handles gracefully
- ⬜ Test fuzzy name matching ("Sarah" → "Sarah Johnson")
- ⬜ Confirm Square token auto-refresh works

---

## Milestone 4 — Multi-Client Readiness

- ⬜ Audit codebase for any hardcoded client assumptions
- ⬜ Verify `ClientRegistry` isolates clients correctly by `agent_id`
- ⬜ Onboard second test business (second Retell agent + second Square sandbox account)
- ⬜ Run both clients simultaneously; confirm calls route to correct Square account
- ⬜ Document the onboarding steps for non-developers

---

## Parking Lot (post-MVP)

- Cancellations and rescheduling via voice
- SMS/email booking confirmations
- Switch Square sandbox → production
- Multi-location support
- Admin dashboard / analytics / billing
