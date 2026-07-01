/**
 * server.ts
 * Application entry point.
 *
 * Order of operations:
 *   1. Import config (runs dotenv.config() — must be first)
 *   2. Import db (opens SQLite, reads DATABASE_PATH from config)
 *   3. Create Express app
 *   4. Register middleware and routes
 *   5. Start listening
 *
 * NOTE: The Retell webhook route uses express.raw() for its body parsing.
 * Do NOT add express.json() globally — it would pre-parse the body and break
 * the Retell HMAC signature check. Each route handles its own body parsing.
 */

// ── Config must be the very first import ─────────────────────────────────────
import { config } from './config';

// ── DB (reads DATABASE_PATH from config) ──────────────────────────────────────
import './db'; // opens + configures the SQLite connection

// ── HTTP layer ────────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import { router } from './routes';
import { logger } from './utils/logger';

const app = express();

// CORS — allow all origins in development; tighten in production if needed.
app.use(cors());

// Trust the first proxy (required for Railway to correctly set req.ip etc.)
app.set('trust proxy', 1);

// Mount all routes.
// Note: body parsing is handled per-route (raw for /webhook/retell, none for GET routes).
app.use(router);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled server error', { error: String(err) });
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = config.PORT;
app.listen(PORT, () => {
  logger.info(`Nott AI server started`, {
    port: PORT,
    env: config.NODE_ENV,
    squareEnv: config.SQUARE_ENVIRONMENT,
  });
});
