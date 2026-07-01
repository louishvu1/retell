/**
 * services/square/SquareOAuthService.ts
 * Handles Square OAuth 2.0: build the auth URL, exchange the code for tokens,
 * persist them, and refresh before they expire.
 *
 * Square access tokens expire every 30 days.
 * We refresh proactively when the token has less than 48 hours remaining.
 *
 * OAuth scopes requested:
 *   APPOINTMENTS_READ APPOINTMENTS_ALL_READ (bookings - buyer + seller level)
 *   APPOINTMENTS_WRITE APPOINTMENTS_ALL_WRITE
 *   CUSTOMERS_READ CUSTOMERS_WRITE
 *   ITEMS_READ
 *   MERCHANT_PROFILE_READ
 *
 * Note: Square renamed BOOKINGS_* → APPOINTMENTS_* scopes.
 * APPOINTMENTS_ALL_READ/WRITE are seller-level (required for acting on behalf of business).
 * Team member booking profiles are covered by APPOINTMENTS_ALL_READ.
 */

import { config } from '../../config';
import { clientRegistry } from '../clients/ClientRegistry';
import { createSquareOAuthClient, createSquareClient } from './SquareClient';
import { logger } from '../../utils/logger';

const OAUTH_SCOPES = [
  'APPOINTMENTS_READ',
  'APPOINTMENTS_ALL_READ',
  'APPOINTMENTS_WRITE',
  'APPOINTMENTS_ALL_WRITE',
  'CUSTOMERS_READ',
  'CUSTOMERS_WRITE',
  'ITEMS_READ',
  'MERCHANT_PROFILE_READ',
].join(' ');

const SQUARE_OAUTH_BASE =
  config.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';

export class SquareOAuthService {
  /** Redirect URI registered in your Square developer app. */
  private get redirectUri(): string {
    return `${config.APP_BASE_URL}/oauth/square/callback`;
  }

  /**
   * Build the Square OAuth authorisation URL.
   * The agent_id is passed as the `state` parameter so we can link the
   * tokens to the right client in the callback.
   */
  buildAuthUrl(agentId: string): string {
    const params = new URLSearchParams({
      client_id: config.SQUARE_APPLICATION_ID,
      scope: OAUTH_SCOPES,
      session: 'false',
      state: agentId,
    });
    return `${SQUARE_OAUTH_BASE}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange the OAuth authorisation code for access + refresh tokens.
   * Fetches the business name and first location, then saves everything to the DB.
   */
  async handleCallback(code: string, agentId: string): Promise<void> {
    const oauthClient = createSquareOAuthClient();

    // Exchange the code for tokens.
    const { result: tokenResult } = await oauthClient.oAuthApi.obtainToken({
      clientId: config.SQUARE_APPLICATION_ID,
      clientSecret: config.SQUARE_APPLICATION_SECRET,
      code,
      grantType: 'authorization_code',
      redirectUri: this.redirectUri,
    });

    const accessToken = tokenResult.accessToken!;
    const refreshToken = tokenResult.refreshToken!;
    const merchantId = tokenResult.merchantId!;
    const expiresAt = new Date(tokenResult.expiresAt!);

    logger.info('Square OAuth tokens received', { merchantId, agentId });

    // Fetch business name from the merchant profile.
    const authedClient = createSquareClient(accessToken);
    const { result: merchantResult } = await authedClient.merchantsApi.retrieveMerchant(merchantId);
    const businessName = merchantResult.merchant?.businessName ?? 'Unknown Business';

    // Fetch the first location to use as the default booking location.
    const { result: locationsResult } = await authedClient.locationsApi.listLocations();
    const locationId = locationsResult.locations?.[0]?.id;
    if (!locationId) {
      throw new Error('No Square locations found for this merchant. Please create a location in Square Dashboard.');
    }

    // Ensure the client row exists (creates it if this is the first OAuth).
    await clientRegistry.upsertClient({ agentId, businessName });

    // Persist the tokens.
    await clientRegistry.updateSquareTokens(agentId, {
      accessToken,
      refreshToken,
      expiresAt,
      merchantId,
      locationId,
    });

    logger.info('OAuth complete', { agentId, businessName, locationId });
  }

  /**
   * Refresh the access token using the refresh token.
   * Called automatically when the token has less than 48 hours left.
   */
  async refreshToken(agentId: string, refreshToken: string): Promise<void> {
    const oauthClient = createSquareOAuthClient();

    const { result } = await oauthClient.oAuthApi.obtainToken({
      clientId: config.SQUARE_APPLICATION_ID,
      clientSecret: config.SQUARE_APPLICATION_SECRET,
      refreshToken,
      grantType: 'refresh_token',
    });

    const client = await clientRegistry.getByAgentId(agentId);

    await clientRegistry.updateSquareTokens(agentId, {
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken ?? refreshToken, // Square may or may not rotate the refresh token
      expiresAt: new Date(result.expiresAt!),
      merchantId: client.squareMerchantId!,
      locationId: client.squareLocationId!,
    });

    logger.info('Square token refreshed', { agentId });
  }

  /**
   * Return a valid access token for the given client, refreshing if needed.
   * Call this before any Square API operation.
   */
  async getValidAccessToken(agentId: string): Promise<string> {
    const client = await clientRegistry.getByAgentId(agentId);

    if (!client.squareAccessToken) {
      throw new Error(`Client ${agentId} has not completed Square OAuth.`);
    }

    // Refresh if expiring within 48 hours.
    const REFRESH_BUFFER_MS = 48 * 60 * 60 * 1000;
    const expiresAt = client.squareTokenExpiresAt;
    const isExpiringSoon =
      !expiresAt || expiresAt.getTime() - Date.now() < REFRESH_BUFFER_MS;

    if (isExpiringSoon) {
      logger.info('Access token expiring soon, refreshing', { agentId });
      await this.refreshToken(agentId, client.squareRefreshToken!);
      // Re-fetch the client with fresh tokens from the DB.
      clientRegistry.invalidate(agentId);
      const fresh = await clientRegistry.getByAgentId(agentId);
      return fresh.squareAccessToken!;
    }

    return client.squareAccessToken;
  }
}

export const squareOAuthService = new SquareOAuthService();
