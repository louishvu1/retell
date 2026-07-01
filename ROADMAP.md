# Development Roadmap

**Last updated:** 2026-06-30

---

## Milestone 0 — Foundation ✅ COMPLETE

Set up the project structure, tooling, types, and documentation.

---

## Milestone 1 — Local Development

**Goal:** Full booking flow working on your machine.

```
Retell → localhost (via ngrok) → Square Sandbox
```

**What you'll need before starting:**
- Your Square Application ID + Secret (from developer.squareup.com → your app)
- Your Retell Agent ID (from Retell dashboard)
- ngrok installed (`npm install -g ngrok` or download from ngrok.com)

**What gets built:**
- Express server running on `localhost:3000`
- Square OAuth flow (connect your sandbox Square account)
- All 4 booking functions: `get_services`, `get_staff`, `check_availability`, `create_booking`
- Retell webhook handler (receives function calls, returns results)
- SQLite database with first client registered

**Success criteria:**
A Retell test call triggers `create_booking` and a real appointment appears in your Square sandbox dashboard.

**Complexity:** Medium-High | **Dependencies:** Milestone 0 ✅

---

## Milestone 2 — Deploy to Railway

**Goal:** Backend is live on the internet with HTTPS.

```
GitHub → Railway → public HTTPS URL (e.g. https://nott-ai.up.railway.app)
```

**What gets done:**
- Create a GitHub repository and push the code
- Connect Railway to the GitHub repo (auto-deploys on every push)
- Set all environment variables in Railway dashboard
- Configure a persistent volume for the SQLite database file
- Confirm `/health` returns 200 from the public URL

**Success criteria:**
`https://your-app.up.railway.app/health` returns `{ status: "ok" }`.

**Complexity:** Low | **Dependencies:** Milestone 1

---

## Milestone 3 — Point Retell at Railway

**Goal:** Retell stops calling localhost and starts calling the deployed server.

```
Retell webhook URL: https://your-app.up.railway.app/webhook/retell
```

**What gets done:**
- Update the webhook URL in the Retell agent settings
- Re-run the Square OAuth flow against the production server
- Register the production client in the Railway database

**Success criteria:**
Retell function calls hit Railway — no ngrok needed.

**Complexity:** Very Low | **Dependencies:** Milestone 2

---

## Milestone 4 — Production Testing

**Goal:** Real phone calls work end-to-end.

```
Real phone call → Retell → Railway → Square Sandbox → Booking confirmed
```

**What gets tested:**
- Full conversation: service selection, staff selection, availability, booking
- Fuzzy staff name matching ("Can I book with Sarah?" → confirms "Sarah Johnson")
- Edge cases: unavailable staff, full slots, token expiry
- Call quality and agent response accuracy

**Success criteria:**
Make 5 real phone calls. All 5 result in correct bookings in Square sandbox. Agent handles "no availability" gracefully.

**Complexity:** Low (testing, not building) | **Dependencies:** Milestone 3

---

## Milestone 4.5 — Multi-Client Readiness

**Goal:** Prove the architecture scales to many clients without code changes.

```
New business → create Retell agent → connect Square via OAuth → they're live
```

**What gets done:**
- Audit the codebase for any hardcoded client assumptions (agent IDs, Square credentials, business names baked into logic)
- Verify `ClientRegistry` correctly isolates each client by `agent_id`
- Verify `SquareBookingAdapter` uses per-client tokens — never mixes credentials
- Verify the OAuth flow correctly stores tokens against the new client's agent ID
- Onboard a second test business (a second Square sandbox account + a second Retell agent) without touching core code
- Run both clients simultaneously and confirm calls route to the correct Square account

**What you need to provide:**
- A second Retell agent ID
- A second Square sandbox account (can be a test account)

**Success criteria:**
Two separate Retell agents each book into their own Square accounts. No code changes required to add the second client — only configuration. Claude can demonstrate this is repeatable for a 3rd, 4th, 50th client.

**Complexity:** Low-Medium (mostly verification + one refactor pass if gaps are found)
**Dependencies:** Milestone 4

---

## After Milestone 4.5 — Robustness & Scale

Once the happy path works, harden it:

- Cancellations and rescheduling via voice
- SMS/email confirmation to customers
- Multi-client onboarding (second business connects their own Square)
- Switch Square from sandbox to production
- Multi-location support

---

## Parking Lot (out of scope until booking is proven)

- Admin dashboard
- Analytics
- Billing
- CRM
- Marketing pages
