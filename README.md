# Nott AI

AI receptionist backend for local service businesses.

Connects **Retell AI** (voice agent) to **Square Appointments** (booking system) so customers can book appointments by phone — no human required.

---

## What It Does

A business customer calls. Retell AI handles the conversation. When the customer wants to book, Retell calls functions on this backend. This backend talks to Square and confirms the booking — all in real time.

---

## Quick Start

### Prerequisites

- Node.js 20+
- A Square Developer account → [developer.squareup.com](https://developer.squareup.com)
- A Retell AI account → [retellai.com](https://retellai.com)
- `ngrok` (for local development webhook tunnelling)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in your keys — see .env.example for descriptions

# 3. Create the database
npm run db:migrate

# 4. Start development server
npm run dev
```

The server starts on `http://localhost:3000`.

For Retell webhooks to reach your local machine, run ngrok in a separate terminal:

```bash
ngrok http 3000
```

Copy the ngrok HTTPS URL and set it as `APP_BASE_URL` in your `.env`.

---

## Core Concepts

**Client** — a registered business (e.g. Los Cab Sports Village). Each client has one Retell agent and one connected Square account.

**Agent ID** — Retell's identifier for an agent. This is how the backend knows which business it is serving on each incoming call.

**Booking Router** — a provider-agnostic abstraction. All booking operations go through this layer. Square is the only provider today; others can be added without changing anything else.

---

## Project Structure

```
src/
├── server.ts                    # Express app entry point
├── config/index.ts              # Environment variable validation
├── routes/
│   ├── retell.routes.ts         # POST /webhook/retell
│   ├── oauth.routes.ts          # Square OAuth flow
│   └── health.routes.ts         # GET /health
├── services/
│   ├── booking/
│   │   ├── BookingRouter.ts     # Provider-agnostic booking interface
│   │   ├── booking.types.ts     # Shared types (Service, Slot, etc.)
│   │   └── providers/
│   │       └── SquareBookingAdapter.ts
│   ├── square/
│   │   ├── SquareClient.ts      # Square API wrapper
│   │   └── SquareOAuthService.ts
│   ├── retell/
│   │   ├── RetellFunctionHandler.ts
│   │   └── retell.types.ts
│   └── clients/
│       ├── ClientRegistry.ts    # agent_id → client config lookup
│       └── client.types.ts
├── db/
│   ├── schema.ts                # Drizzle table definitions
│   └── index.ts                 # DB connection
└── utils/
    ├── fuzzyMatch.ts            # Approximate staff name matching
    ├── errors.ts                # Custom error classes
    └── logger.ts
```

---

## Retell Functions

The Retell agent is configured to call these functions:

| Function            | What it does                                       |
|---------------------|----------------------------------------------------|
| `get_services`      | Lists available services from Square Catalog       |
| `get_staff`         | Lists bookable staff members                       |
| `check_availability`| Returns open slots for a service/staff/date        |
| `create_booking`    | Creates the appointment in Square                  |

---

## Documentation

See the `/docs` directory and root-level `.md` files for full project context:

- `PROJECT_CONTEXT.md` — business and product context
- `ARCHITECTURE.md`    — system design and request flows
- `CURRENT_STATUS.md`  — what is and isn't implemented yet
- `NEXT_TASK.md`       — what to work on next
- `DECISIONS.md`       — key architectural decisions and rationale
- `TODO.md`            — full task backlog
