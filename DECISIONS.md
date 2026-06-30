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
**Status:** Proposed (to be confirmed next session)

**Decision:** During a multi-turn booking conversation, hold intermediate state (chosen service, chosen staff, chosen time) in an in-memory Map keyed by `call_id`.

**Reasoning:**
- Retell function calls within one call session all happen within seconds — in-memory is perfectly reliable.
- Avoids DB schema complexity for ephemeral state.
- Simple to understand and debug.

**Risk:** If the server restarts mid-call (extremely unlikely), the state is lost and the caller would need to start over. Acceptable for PoC.

**Alternative if needed:** Store booking session state in the DB with a TTL column.

---

## DEC-006 — Verify Retell webhook signatures

**Date:** 2026-06-30
**Status:** Pending (implementation in next session)

**Decision:** Reject any request to `/webhook/retell` that does not carry a valid Retell signature.

**Reasoning:**
- Without this, anyone who discovers the URL can send fake booking requests.
- Retell provides a signing secret and signature header.
- Must verify the exact signature mechanism against Retell docs before implementing.

---

## DEC-007 — Square OAuth as the ONLY authentication mechanism

**Date:** 2026-06-30
**Status:** Accepted

**Decision:** No user login, no JWT, no sessions. The only "auth" in the system is Square OAuth, which is used to connect a business's Square account.

**Reasoning:**
- Consistent with project instructions (no auth systems beyond Square OAuth).
- The backend is not user-facing; it only receives Retell webhooks and handles OAuth callbacks.
- A business owner goes through OAuth once during setup. After that, everything is automated.
