/**
 * routes/index.ts
 * Aggregates all route modules into a single Router, mounted at root in server.ts.
 *
 * Routes:
 *   POST /webhook/retell          → retell.routes.ts
 *   GET  /oauth/square/start      → oauth.routes.ts
 *   GET  /oauth/square/callback   → oauth.routes.ts
 *   GET  /health                  → health.routes.ts
 */

import { Router } from 'express';
import { retellRouter } from './retell.routes';
import { oauthRouter } from './oauth.routes';
import { healthRouter } from './health.routes';

export const router = Router();

router.use(retellRouter);
router.use(oauthRouter);
router.use(healthRouter);
