/**
 * routes/index.ts
 * Aggregates all route modules and exports a single Express Router.
 * Mounted in server.ts.
 *
 * Routes:
 *   POST /webhook/retell          → retell.routes.ts
 *   GET  /oauth/square/start      → oauth.routes.ts
 *   GET  /oauth/square/callback   → oauth.routes.ts
 *   GET  /health                  → health.routes.ts
 *
 * Implementation: next session.
 */
export {};
