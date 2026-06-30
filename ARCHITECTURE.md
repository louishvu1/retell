# Architecture — Nott AI

**Last updated:** 2026-06-30

---

## System Overview

Nott AI sits between two external systems: **Retell AI** (voice conversation) and **Square Appointments** (booking). Our backend is the glue.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER (CALLER)                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Phone call
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           RETELL AI                                 │
│  Handles voice ↔ text, LLM conversation, slot filling, and         │
│  triggers function calls when it needs real data.                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS POST /webhook/retell
                               │ (function call request)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NOTT AI BACKEND                             │
│                                                                     │
│  ┌──────────────────┐    ┌─────────────────────────────────────┐   │
│  │  ClientRegistry  │    │         BookingRouter               │   │
│  │                  │    │                                     │   │
│  │  agent_id        │    │  provider-agnostic interface        │   │
│  │  → ClientConfig  │    │                                     │   │
│  │  → Square tokens │    │  ┌──────────────────────────────┐  │   │
│  └──────────────────┘    │  │   SquareBookingAdapter       │  │   │
│                           │  │                              │  │   │
│  ┌──────────────────┐    │  │   listServices()             │  │   │
│  │   FuzzyMatch     │    │  │   listStaff()                │  │   │
│  │   (staff names)  │    │  │   getAvailability()          │  │   │
│  └──────────────────┘    │  │   createBooking()            │  │   │
│                           │  └──────────────────────────────┘  │   │
│                           └──────────────────┬──────────────────┘   │
│                                              │                       │
└──────────────────────────────────────────────┼───────────────────────┘
                                               │ Square API calls
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SQUARE APPOINTMENTS                         │
│  Catalog API · Team API · Bookings API · Customers API              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow — Booking Call

A full booking call goes through several function calls. Here is the complete flow:

```
CUSTOMER                RETELL AI               NOTT AI              SQUARE
   │                       │                       │                    │
   │   "I'd like to book   │                       │                    │
   │    a manicure"        │                       │                    │
   │──────────────────────▶│                       │                    │
   │                       │  POST /webhook/retell  │                    │
   │                       │  { name: "get_services" }                  │
   │                       │──────────────────────▶│                    │
   │                       │                       │  GET /catalog/list  │
   │                       │                       │───────────────────▶│
   │                       │                       │  [services list]    │
   │                       │                       │◀───────────────────│
   │                       │  { result: "[{...}]" } │                    │
   │                       │◀──────────────────────│                    │
   │   "We have gel nails, │                       │                    │
   │    regular nails..."  │                       │                    │
   │◀──────────────────────│                       │                    │
   │                       │                       │                    │
   │   "Gel nails please,  │                       │                    │
   │    with Sarah"        │                       │                    │
   │──────────────────────▶│                       │                    │
   │                       │  POST /webhook/retell  │                    │
   │                       │  { name: "get_staff"  }                    │
   │                       │──────────────────────▶│                    │
   │                       │                       │  GET /team/members  │
   │                       │                       │───────────────────▶│
   │                       │                       │  [staff list]       │
   │                       │                       │◀───────────────────│
   │                       │  { result: "[{...}]" } │                    │
   │                       │◀──────────────────────│                    │
   │                       │                       │                    │
   │                       │   [fuzzy match "Sarah" → "Sarah Johnson"]  │
   │                       │                       │                    │
   │   "I found Sarah      │                       │                    │
   │    Johnson — any date │                       │                    │
   │    preference?"       │                       │                    │
   │◀──────────────────────│                       │                    │
   │                       │                       │                    │
   │   "Tomorrow at 2pm"   │                       │                    │
   │──────────────────────▶│                       │                    │
   │                       │  POST /webhook/retell  │                    │
   │                       │  { name: "check_availability",             │
   │                       │    arguments: { serviceId, staffId, date }}│
   │                       │──────────────────────▶│                    │
   │                       │                       │  POST /bookings/    │
   │                       │                       │  availability       │
   │                       │                       │───────────────────▶│
   │                       │                       │  [available slots]  │
   │                       │                       │◀───────────────────│
   │                       │  { result: "[slots]" } │                    │
   │                       │◀──────────────────────│                    │
   │   "Sarah has 2pm and  │                       │                    │
   │    3pm available"     │                       │                    │
   │◀──────────────────────│                       │                    │
   │                       │                       │                    │
   │   "2pm please, I'm    │                       │                    │
   │    Emma, 0412 345 678"│                       │                    │
   │──────────────────────▶│                       │                    │
   │                       │  POST /webhook/retell  │                    │
   │                       │  { name: "create_booking",                 │
   │                       │    arguments: { ..., customerName, phone }}│
   │                       │──────────────────────▶│                    │
   │                       │                       │  POST /customers    │
   │                       │                       │  (find or create)   │
   │                       │                       │───────────────────▶│
   │                       │                       │  POST /bookings     │
   │                       │                       │───────────────────▶│
   │                       │                       │  booking confirmed  │
   │                       │                       │◀───────────────────│
   │                       │  { result: "Booked!   │                    │
   │                       │    Confirmation #..." }│                   │
   │                       │◀──────────────────────│                    │
   │   "You're booked for  │                       │                    │
   │    tomorrow at 2pm    │                       │                    │
   │    with Sarah Johnson"│                       │                    │
   │◀──────────────────────│                       │                    │
```

---

## Request Flow — Square OAuth (Client Onboarding)

This happens once per client, when the business owner connects their Square account.

```
BUSINESS OWNER          NOTT AI BACKEND          SQUARE
      │                       │                     │
      │  GET /oauth/square/   │                     │
      │  start?agent_id=xxx   │                     │
      │──────────────────────▶│                     │
      │                       │  Build Square OAuth  │
      │                       │  authorisation URL  │
      │  302 → square.com/    │                     │
      │  oauth?...            │                     │
      │◀──────────────────────│                     │
      │                       │                     │
      │───────────────────────────────────────────▶│
      │  [Business owner approves on Square]        │
      │◀───────────────────────────────────────────│
      │                       │                     │
      │  GET /oauth/square/   │                     │
      │  callback?code=xxx    │                     │
      │  &state=agent_id      │                     │
      │──────────────────────▶│                     │
      │                       │  POST /oauth/token  │
      │                       │───────────────────▶│
      │                       │  { access_token,    │
      │                       │    refresh_token,   │
      │                       │    merchant_id }    │
      │                       │◀───────────────────│
      │                       │                     │
      │                       │  Save tokens to DB  │
      │                       │  linked to agent_id │
      │                       │                     │
      │  "Connected! Your AI  │                     │
      │   receptionist is     │                     │
      │   ready."             │                     │
      │◀──────────────────────│                     │
```

---

## Component Responsibilities

### `src/routes/retell.routes.ts`
- Receive POST from Retell
- Verify Retell webhook signature (reject if invalid)
- Extract `agent_id`, look up client via `ClientRegistry`
- Pass to `RetellFunctionHandler`
- Return the function result

### `src/services/retell/RetellFunctionHandler.ts`
- Dispatch based on `function.name`:
  - `get_services` → `BookingRouter.listServices()`
  - `get_staff` → `BookingRouter.listStaff()`
  - `check_availability` → `BookingRouter.getAvailability()`
  - `create_booking` → `BookingRouter.createBooking()`
- For `get_staff`: run fuzzy matching if caller named a specific person
- Format results as strings for the Retell LLM

### `src/services/booking/BookingRouter.ts`
- Hold a registry of provider adapters
- Select the right adapter for a client's `bookingProvider`
- Delegate all calls to the adapter
- This class never knows anything about Square specifically

### `src/services/booking/providers/SquareBookingAdapter.ts`
- The ONLY place Square-specific logic lives in the booking layer
- Translates between Nott AI booking types and Square API types
- Uses `SquareClient` for all HTTP calls

### `src/services/square/SquareClient.ts`
- Thin wrapper around the Square SDK
- Accepts an access token, creates an authenticated client
- Exposes methods for the specific Square APIs we use

### `src/services/square/SquareOAuthService.ts`
- Build OAuth authorisation URLs
- Exchange auth codes for tokens
- Persist tokens
- Refresh tokens before expiry

### `src/services/clients/ClientRegistry.ts`
- Single source of truth for client configuration
- `getByAgentId(agentId)` — throws `ClientNotFoundError` if unknown
- Optionally caches results in memory

### `src/db/`
- SQLite database via Drizzle ORM
- `schema.ts` defines the `clients` table
- `index.ts` exports the typed `db` object used everywhere

### `src/utils/fuzzyMatch.ts`
- `fuzzyMatchStaff(input, candidates)` → `MatchResult`
- Used by `RetellFunctionHandler` when staff is named by the caller

---

## Database Schema

```
clients
  id                     INTEGER   PRIMARY KEY AUTOINCREMENT
  business_name          TEXT      NOT NULL
  retell_agent_id        TEXT      NOT NULL UNIQUE
  booking_provider       TEXT      NOT NULL DEFAULT 'square'
  square_merchant_id     TEXT
  square_location_id     TEXT
  square_access_token    TEXT
  square_refresh_token   TEXT
  square_token_expires_at INTEGER  (Unix timestamp)
  created_at             INTEGER   NOT NULL DEFAULT (unixepoch())
```

One row per registered business. Square token columns are nullable so a client record can be created before OAuth is completed.

---

## Folder Responsibilities

```
src/
├── config/       — Environment validation. Touch this when adding env vars.
├── routes/       — HTTP endpoints. Touch this when adding new URLs.
├── services/
│   ├── booking/  — Provider-agnostic booking logic. Touch this for booking features.
│   │   └── providers/  — One file per booking system (Square, Acuity, etc.)
│   ├── square/   — Square SDK and OAuth. Touch this for Square-specific issues.
│   ├── retell/   — Retell webhook parsing and function dispatch.
│   └── clients/  — Client lookup and configuration.
├── db/           — Database schema and connection. Touch this for schema changes.
└── utils/        — Shared utilities. No business logic.
```

---

## Session State Strategy

Retell calls our functions multiple times per booking conversation (get services → get staff → check availability → create booking). We need to pass state between these calls.

**MVP approach:** In-memory `Map<call_id, BookingSessionState>` stored in `RetellFunctionHandler`.

```typescript
interface BookingSessionState {
  selectedServiceId?: string;
  selectedStaffId?: string;
  selectedStartTime?: string;
  customerName?: string;
  customerPhone?: string;
}
```

Each call from Retell includes the same `call_id` for the duration of the conversation. We store and accumulate state under that key.

**Limitation:** State is lost on server restart. For PoC, this is acceptable.

**Future:** If we move to multiple server instances (horizontal scaling), this state must move to Redis or the database.

---

## Future Expansion Points

The following are explicitly designed to be extensible without refactoring:

### Adding a booking provider (e.g. Acuity)
1. Create `src/services/booking/providers/AcuityBookingAdapter.ts`
2. Implement the `BookingProvider` interface
3. Register it in `BookingRouter`
4. Add `'acuity'` to the `BookingProvider` type in `client.types.ts`
5. Done. No other files change.

### Adding a new Retell function (e.g. cancel booking)
1. Add `'cancel_booking'` to `RetellFunctionName` in `retell.types.ts`
2. Add a `cancelBooking()` method to the `BookingProvider` interface
3. Implement it in `SquareBookingAdapter`
4. Add the dispatch case in `RetellFunctionHandler`

### Adding a second server instance
1. Replace in-memory session state with Redis
2. Change `ClientRegistry` to invalidate its cache periodically (or remove caching)
3. SQLite must become PostgreSQL (or use a mounted shared volume — feasible on Railway)

---

## What Is Intentionally Out of Scope for MVP

| Feature                        | Reason excluded                              |
|-------------------------------|----------------------------------------------|
| Admin UI / dashboard           | Not needed to validate the booking flow      |
| Analytics / reporting          | Premature optimisation                        |
| Billing / subscriptions        | Validation before monetisation               |
| Cancellations / rescheduling   | Booking first, then iteration                |
| SMS/email reminders            | Post-booking feature, not core               |
| Multi-location support         | Single location per client for MVP           |
| CRM integration                | Out of scope per project instructions        |
| Second booking provider        | Architecture supports it; not needed yet     |
| Authentication beyond OAuth    | No user-facing interface to protect          |

---

## Key Constraints

1. **Retell webhooks must respond within a few seconds.** Square API calls must be fast. Do not implement heavy logic in the webhook handler.
2. **Square access tokens expire every 30 days.** Token refresh must be handled automatically and transparently.
3. **No secrets in source code or git.** All credentials in `.env` only.
4. **HTTPS required.** Retell will not call HTTP endpoints. Use ngrok in development; a proper TLS-terminated host in production.
