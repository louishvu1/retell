/**
 * routes/retell.routes.ts
 * POST /webhook/retell
 *
 * Every custom function call from Retell AI hits this endpoint.
 *
 * IMPORTANT: Uses express.raw(), NOT express.json().
 * Retell signature verification requires the exact raw body bytes.
 * Parsing with express.json() first changes whitespace/ordering and breaks HMAC.
 *
 * Flow:
 *   1. Verify Retell signature via Retell.verify(rawBody, apiKey, signature)
 *   2. Parse the JSON from raw bytes
 *   3. Look up the client by agent_id
 *   4. Dispatch to RetellFunctionHandler
 *   5. Return the result — Retell accepts any JSON and converts it to a string for the LLM
 */

import { Router, raw } from 'express';
import { Retell } from 'retell-sdk';
import { config } from '../config';
import { clientRegistry } from '../services/clients/ClientRegistry';
import { retellFunctionHandler } from '../services/retell/RetellFunctionHandler';
import type { RetellFunctionCallPayload } from '../services/retell/retell.types';
import { ClientNotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export const retellRouter = Router();

retellRouter.post(
  '/webhook/retell',
  // raw() gives us the Buffer — required for HMAC verification.
  raw({ type: 'application/json', limit: '10mb' }),
  async (req, res) => {
    const rawBody = (req.body as Buffer).toString('utf-8');
    const signature = req.headers['x-retell-signature'] as string | undefined;

    // ── 1. Signature verification ───────────────────────────────────────────
    if (!signature || !Retell.verify(rawBody, config.RETELL_API_KEY, signature)) {
      logger.warn('Retell webhook signature verification failed');
      return res.status(401).json({ error: 'Unauthorised' });
    }

    // ── 2. Parse payload ────────────────────────────────────────────────────
    let payload: RetellFunctionCallPayload;
    try {
      payload = JSON.parse(rawBody) as RetellFunctionCallPayload;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    // ── 2b. Detect lifecycle events (call_started, call_ended, etc.) ───────────
    // Retell sends these to the Agent Level Webhook URL — same endpoint as
    // function calls. They have no `name` field; we acknowledge and skip.
    if (!payload.name) {
      const event = (payload as Record<string, unknown>).event ?? 'unknown';
      logger.debug('Received Retell lifecycle event (not a function call)', {
        event,
        keys: Object.keys(payload),
      });
      return res.status(200).json({ received: true });
    }

    const agentId = payload.call?.agent_id;
    if (!agentId) {
      return res.status(400).json({ error: 'Missing call.agent_id in payload' });
    }

    // ── 3. Look up client ───────────────────────────────────────────────────
    let client;
    try {
      client = await clientRegistry.getByAgentId(agentId);
    } catch (err) {
      if (err instanceof ClientNotFoundError) {
        logger.warn('Retell call from unregistered agent', { agentId });
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }

    // ── 4. Dispatch ─────────────────────────────────────────────────────────
    const result = await retellFunctionHandler.handle(payload, client);

    // ── 5. Return result ────────────────────────────────────────────────────
    return res.json(result);
  },
);
