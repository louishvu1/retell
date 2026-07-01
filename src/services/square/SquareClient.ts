/**
 * services/square/SquareClient.ts
 * Factory functions for creating Square SDK Client instances.
 *
 * Keeps the SDK instantiation in one place so the environment config
 * (sandbox vs production) is never scattered across the codebase.
 *
 * Two flavours:
 *   createSquareClient(token)  — for API calls on behalf of a business
 *   createSquareOAuthClient()  — for the OAuth token exchange (no token needed)
 */

import { Client, Environment } from 'square';
import { config } from '../../config';

export type SquareEnvironment = 'sandbox' | 'production';

/** Create an authenticated Square client for a specific business's access token. */
export function createSquareClient(accessToken: string): Client {
  const environment =
    config.SQUARE_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox;

  return new Client({ accessToken, environment });
}

/**
 * Create a Square client for the OAuth token exchange.
 * No access token is required at this point — we're obtaining one.
 */
export function createSquareOAuthClient(): Client {
  const environment =
    config.SQUARE_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox;

  return new Client({ environment });
}
