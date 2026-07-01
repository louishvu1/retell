/**
 * routes/health.routes.ts
 * GET /health
 * Used by Railway, uptime monitors, and load balancers to confirm the server is alive.
 */

import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
