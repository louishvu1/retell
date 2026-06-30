/**
 * utils/logger.ts
 * Structured logger for the application.
 *
 * Uses a simple wrapper so we can swap to Winston/Pino later without
 * touching every call site.
 *
 * In development: coloured console output.
 * In production:  JSON lines (structured, easy to parse in log aggregators).
 *
 * Implementation: next session.
 */
export {};
