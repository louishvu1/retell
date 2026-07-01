/**
 * routes/oauth.routes.ts
 * Square OAuth 2.0 flow for connecting a business's Square account.
 *
 * GET /oauth/square/start?agent_id=<retell_agent_id>
 *   Business owner visits this URL (once) to connect their Square account.
 *   We redirect them to Square's OAuth page; the agent_id travels in `state`.
 *
 * GET /oauth/square/callback?code=<auth_code>&state=<agent_id>
 *   Square redirects back here after the owner approves.
 *   We exchange the code for tokens, fetch business info, save everything,
 *   and show a success message.
 */

import { Router } from 'express';
import { squareOAuthService } from '../services/square/SquareOAuthService';
import { logger } from '../utils/logger';

export const oauthRouter = Router();

// ── Start ────────────────────────────────────────────────────────────────────

oauthRouter.get('/oauth/square/start', (req, res) => {
  const agentId = req.query['agent_id'] as string | undefined;

  if (!agentId) {
    return res.status(400).send('Missing query parameter: agent_id');
  }

  const authUrl = squareOAuthService.buildAuthUrl(agentId);
  logger.info('Starting Square OAuth', { agentId });
  return res.redirect(authUrl);
});

// ── Callback ─────────────────────────────────────────────────────────────────

oauthRouter.get('/oauth/square/callback', async (req, res) => {
  const code = req.query['code'] as string | undefined;
  const agentId = req.query['state'] as string | undefined;
  const error = req.query['error'] as string | undefined;

  // Square sends an error param if the owner denied the request.
  if (error) {
    logger.warn('Square OAuth denied', { error, agentId });
    return res.status(400).send(`
      <h2>Connection cancelled</h2>
      <p>Square OAuth was denied or cancelled. You can try again at /oauth/square/start?agent_id=${agentId ?? ''}</p>
    `);
  }

  if (!code || !agentId) {
    return res.status(400).send('Missing code or state parameter from Square callback.');
  }

  try {
    await squareOAuthService.handleCallback(code, agentId);
    logger.info('Square OAuth complete', { agentId });

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Connected — Nott AI</title></head>
      <body style="font-family: sans-serif; max-width: 480px; margin: 80px auto; text-align: center;">
        <h2>✅ Square connected successfully</h2>
        <p>Your AI receptionist is now linked to your Square account.</p>
        <p>You can close this window.</p>
        <hr/>
        <small style="color: #888;">Agent ID: ${agentId}</small>
      </body>
      </html>
    `);
  } catch (err) {
    logger.error('Square OAuth callback failed', { agentId, error: String(err) });
    return res.status(500).send(`
      <h2>Connection failed</h2>
      <p>${err instanceof Error ? err.message : 'An unexpected error occurred.'}</p>
      <p>Please try again or contact support.</p>
    `);
  }
});
