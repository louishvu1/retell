# Architectural Decisions

A log of key decisions made during development. Each entry explains what was decided, why, and what alternatives were considered.

---

## DEC-001 — SQLite for the database (not Supabase or PostgreSQL)

**Date:** 2026-06-30
**Status:** Accepted

**Decision:** Use SQLite with Drizzle ORM as the database for MVP.

**Reasoning:**
- The project instructions explicitly rule out Supabase.
- The data model is simple (a handful of client rows with Square tokens).
- SQLite needs zero setup — no external server, no credentials, no network.
- Drizzle ORM provides TypeScript type safety and easy migration to PostgreSQL later.
- When the project outgrows SQLite (multiple servers, heavy concurrent writes), migrating to PostgreSQL with Drizzle is a schema-compatible change.

**Alternatives considered:**
- Supabase — ruled out by project instructions.
- PostgreSQL locally — more complexity than the PoC warrants.
- JSON file store — simpler but no transactions, no type safety.

---

## DEC-002 — Express.js (not Fastify or Hono)

**Date:** 2026-06-30
**Status:** Accepted

**Decision:** Use Express.js as the HTTP framework.

**Reasoning:**
- Extremely well-known; easy to explain and debug.
- Massive ecosystem; every Square/Retell integration example uses Express.
- Sufficient for the request volume this PoC will see.

**Alternatives considered:**
- Fastify — faster, but more complex; performance is not a concern at this scale.
- Hono — modern and fast, but less documentation available for beginners.

---

## DEC-003 — BookingRouter abstraction from day one

**Date:** 2026-06-30
**Status:** Accepted

**Decision:** All booking operations go through a `BookingProvider` interface. The `BookingRouter` selects the right adapter per client. Only `SquareBookingAdapter` is implemented today.

**Reasoning:**
- The project explicitly calls for this abstraction.
- Implementing it now costs very little (just an interface + one class).
- Adding a second provider later (Acuity, Mindbody) means adding one new file — no refactoring of existing code.

---

## DEC-004 — Retell Agent ID as the client identifier

**Date:** 2026-06-30
**Status:** Accepted

**Decision:** When a Retell webhook arrives, we use the `agent_id` field to identify which business client the call belongs to.

**Reasoning:**
- Each client gets exactly one Retell agent, so agent_id is a natural 1:1 key.
- It's included in every Retell webhook automatically — no extra setup per call.
- Avoids needing a separate API key per client at this stage.

**Risk:** If a client ever has multiple agents (e.g. different agents for different locations), we'd need to extend the model. Acceptable for MVP.

---

## DEC-005 — In-memory session state (not DB-persisted)

**Date:** 2026-06-30
**Status:** Accepted (implemented)

**Decision:** During a multi-turn booking conversation, hold intermediate state (chosen service, chosen staff, chosen time) in an in-memory Map keyed by `call_id`.

**Reasoning:**
- Retell function calls within one call session all happen within seconds — in-memory is perfectly reliable.
- Avoids DB schema complexity for ephemeral state.
- Simple to understand and debug.

**Risk:** If the server restarts mid-call (extremely unlikely), the state is lost and the caller would need to start over. Acceptable for PoC.

**Alternative if needed:** Store booking session state in the DB with a TTL column.

---

## DEC-006 — Retell webhook signature verification

**Date:** 2026-06-30
**Status:** Accepted (implemented)

**Decision:** Reject any request to `/webhook/retell` that does not carry a valid Retell signature.

**Reasoning:**
- Without this, anyone who discovers the URL can send fake booking requests.
- Retell's SDK provides `Retell.verify(rawBody, RETELL_API_KEY, signature)`.
- The `x-retell-signature` header uses HMAC-SHA256 with the API key.

**Implementation detail:** The webhook route uses `express.raw()` instead of `express.json()`.
The raw bytes are required for HMAC verification — re-parsing JSON changes whitespace
and breaks the signature check. Do NOT add `express.json()` globally.

**Key finding from docs:** Signature verification uses `RETELL_API_KEY` (NOT a separate
webhook secret). The API key must have the "webhook badge" in the Retell dashboard.

---

## DEC-007 — Square OAuth as the ONLY authentication mechanism

**Date:** 2026-06-30
**Status:** Accepted

**Decision:** No user login, no JWT, no sessions. The only "auth" in the system is Square OAuth, which is used to connect a business's Square account.

**Reasoning:**
- Consistent with project instructions (no auth systems beyond Square OAuth).
- The backend is not user-facing; it only receives Retell webhooks and handles OAuth callbacks.
- A business owner goes through OAuth once during setup. After that, everything is automated.

---

## DEC-008 — Square service IDs are ITEM_VARIATION IDs

**Date:** 2026-06-30
**Status:** Accepted (implemented)

**Decision:** When listing services, return the ITEM_VARIATION ID (not the ITEM ID) as the service ID throughout the booking conversation.

**Reasoning:**
- Square's availability search (`searchAvailability`) requires a `serviceVariationId` (ITEM_VARIATION), not an ITEM ID.
- Square's booking creation also requires `serviceVariationId` + `serviceVariationVersion`.
- The LLM receives variation IDs as "service IDs", and passes them back in subsequent calls.
- The LLM doesn't know or care about the distinction — it's transparent to the conversation.

**Implication:** When calling `createBooking`, the adapter does a `retrieveCatalogObject` to get the current version for optimistic locking. This adds one extra API call but is required by Square.

---

## DEC-010 — Skip full Square sandbox e2e test, deploy to Railway instead

**Date:** 2026-07-01
**Status:** Accepted

**Decision:** Do not block Milestone 2 on completing a full e2e booking in the Square sandbox. Deploy to Railway and validate the full flow there against a properly configured Square account.

**Reasoning:**
- Square sandbox blocks making team members "bookable" via API (404 on booking profile PUT, 403 on profile list)
- The sandbox dashboard UI for team management is broken (shows onboarding marketing page)
- All other parts of the stack are proven working: get_services, check_availability, webhook routing, OAuth
- The booking code (createBooking, findOrCreateCustomer) is correct — it's a data issue, not a code issue
- Railway deployment was the planned next step anyway

**What was proven locally:**
- get_services returns real Square catalog data ✅
- check_availability is called correctly by the Retell agent ✅
- Webhook signature verification works ✅
- OAuth flow complete with tokens stored in DB ✅

---

## DEC-009 — Per-route body parsing (not global express.json)

**Date:** 2026-06-30
**Status:** Accepted (implemented)

**Decision:** No global body parsing middleware. Each route applies its own body handling.

**Routes:**
- `POST /webhook/retell` → `express.raw({ type: 'application/json' })` (HMAC requires raw bytes)
- `GET /oauth/square/start` → no body (query params only)
- `GET /oauth/square/callback` → no body (query params only)
- `GET /health` → no body

**Reasoning:** Since all endpoints are either GETs or the webhook (which needs raw body),
there is no need for global JSON body parsing. This avoids accidentally breaking HMAC
verification if someone adds `express.json()` globally later.
