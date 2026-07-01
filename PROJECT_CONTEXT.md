# Project Context — Nott AI

## Business Overview

Nott AI is an AI receptionist platform for local service businesses. Instead of hiring a human receptionist, a business installs Nott AI and their phone is answered by a voice AI agent that can handle common requests — primarily booking appointments.

**Target customers:**
- Nail salons
- Sports clubs (e.g. Los Cab Sports Village)
- Med spas
- Fitness studios
- Any appointment-based local business

**Core value proposition:** A business owner never misses a booking call again. Customers can book 24/7 without staff involvement.

---

## Product Vision (Long-term)

A scalable multi-tenant SaaS platform:
- Many client businesses, each fully isolated
- Each client has their own Retell AI agent, their own Square account, and their own configuration
- Supports multiple booking providers (Square, Acuity, Mindbody, etc.)
- Self-serve onboarding (business connects their own Square account via OAuth)
- Per-client billing, analytics, and customisation

---

## Current Priority (MVP)

**One thing only: a reliable Retell → Square booking flow.**

A proof-of-concept good enough to demo to real customers and validate the concept. Everything else is out of scope until this is working reliably.

---

## What is Explicitly Out of Scope (MVP)

The following will NOT be built until the booking flow is proven:

- Admin dashboards or management UIs
- Analytics or reporting
- Billing or subscription management
- CRM features
- Marketing pages or landing pages
- Supabase or other hosted BaaS
- Authentication systems beyond Square OAuth
- Multi-provider support (Acuity, Mindbody, etc.) — architecture supports it, but only Square will be implemented

---

## Key Stakeholders

| Role          | Name  |
|---------------|-------|
| Founder / Dev | Louis |

---

## First Target Client

**Los Cab Sports Village** — mentioned as a target customer for early demos.

---

## Technology Choices

| Layer        | Technology          | Reason                                                   |
|--------------|---------------------|----------------------------------------------------------|
| Language     | TypeScript          | Type safety, better refactoring, industry standard       |
| Runtime      | Node.js 20          | Large ecosystem, async-native, good Square/Retell SDKs   |
| Web framework| Express.js          | Simple, widely understood, no magic                      |
| Database     | SQLite + Drizzle    | Zero-config, embedded, sufficient for PoC and early prod |
| AI voice     | Retell AI           | Handles voice + LLM; we only need to implement functions |
| Booking      | Square Appointments | Client-chosen booking system; strong API + OAuth support |

---

## Open Questions (to resolve in next session)

1. **Hosting**: Where will this be deployed? (Railway recommended — simple PaaS with HTTPS)
2. **Square credentials**: Do you already have a Square Developer account and app created?
3. **Retell account**: Do you have a Retell account and an agent set up for testing?
4. **Test client**: Will we use a sandbox Square account, or a real business account from day one?
5. **Session state**: Retell function calls are stateless — do we need to track in-progress bookings across turns? (e.g. user says service, then later says staff, then confirms)
