# Next Task

**Start here at the beginning of every new session.**

---

## Current Milestone: 1 — Local Development

**Goal:** Retell → localhost → Square Sandbox booking confirmed.

---

## Before You Start

Have these ready:

- **Square Application ID** — developer.squareup.com → your app → Credentials
- **Square Application Secret** — same place
- **Retell Agent ID** — Retell dashboard → your agent → Settings
- **Retell API Key** — Retell dashboard → Settings → API Keys
- **ngrok** — needed to expose localhost to Retell (free account is fine)

---

## Step-by-Step for Next Session

### Step 1 — Install dependencies
```bash
cd path/to/your/Retell/folder
npm install
```

### Step 2 — Set up your .env file
```bash
cp .env.example .env
```
Then fill in `.env` with your Square and Retell credentials.

### Step 3 — Read the Retell function call webhook docs
Go to https://docs.retellai.com and find the section on custom functions / tools.
Specifically confirm:
- What is the exact JSON shape of the webhook payload?
- What header does Retell use for signature verification?
- How do we verify the signature?

Do NOT implement `retell.routes.ts` until this is confirmed.

### Step 4 — Implement `src/config/index.ts`
Use Zod to validate all env vars at startup. App should exit with a clear error if anything is missing.

### Step 5 — Implement `src/db/schema.ts` + `src/db/index.ts` + `src/db/migrate.ts`
Write the Drizzle `clients` table schema and the migration runner.
Run: `npm run db:migrate`

### Step 6 — Implement `src/services/clients/ClientRegistry.ts`
`getByAgentId(agentId: string): Promise<ClientConfig>` — DB lookup, throws `ClientNotFoundError` if missing.

### Step 7 — Implement Square OAuth (`src/services/square/SquareOAuthService.ts` + `src/routes/oauth.routes.ts`)
Build the OAuth start and callback endpoints. After completing OAuth, the client row in DB should have tokens.

### Step 8 — Implement `src/services/square/SquareClient.ts`
Thin wrapper around the Square SDK. Takes an access token, exposes typed methods for Catalog, Team, Bookings, Customers APIs.

### Step 9 — Implement `src/services/booking/providers/SquareBookingAdapter.ts`
Implement all 4 `BookingProvider` methods using `SquareClient`.

### Step 10 — Implement `src/services/booking/BookingRouter.ts`
Wire up the adapter. `getProvider(client)` returns the correct adapter.

### Step 11 — Implement `src/services/retell/RetellFunctionHandler.ts`
Dispatch to booking functions based on function name. Format results as strings.

### Step 12 — Implement `src/routes/retell.routes.ts`
Verify Retell signature, look up client, call handler, return result.

### Step 13 — Implement `src/server.ts`
Assemble everything: Express app, middleware, routes, DB init.

### Step 14 — Register first test client
```bash
npx ts-node src/db/seed.ts
```
(Fill in your Retell Agent ID in seed.ts first.)

### Step 15 — Start ngrok + test
```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
```
Set the ngrok URL as `APP_BASE_URL` in `.env`.
Visit `http://localhost:3000/oauth/square/start?agent_id=YOUR_AGENT_ID` to connect Square.
Trigger a Retell test call and verify the booking appears in Square sandbox.

---

## Success Criteria

A Retell function call to `create_booking` creates a confirmed appointment in Square sandbox.
