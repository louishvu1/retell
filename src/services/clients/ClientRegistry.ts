/**
 * services/clients/ClientRegistry.ts
 * Looks up and updates client configuration by Retell agent ID.
 *
 * Every inbound webhook from Retell includes the agent_id. We use that
 * to find the business's Square credentials. This is the single source
 * of truth for who is who.
 *
 * A simple in-process cache avoids a DB hit on every webhook call.
 * Cache is invalidated when tokens are updated (e.g. after refresh).
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { clients } from '../../db/schema';
import type { ClientConfig } from './client.types';
import { ClientNotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

type Row = typeof clients.$inferSelect;

function mapRow(row: Row): ClientConfig {
  return {
    id: row.id,
    businessName: row.businessName,
    retellAgentId: row.retellAgentId,
    bookingProvider: row.bookingProvider as ClientConfig['bookingProvider'],
    squareMerchantId: row.squareMerchantId,
    squareAccessToken: row.squareAccessToken,
    squareRefreshToken: row.squareRefreshToken,
    squareLocationId: row.squareLocationId,
    squareTokenExpiresAt: row.squareTokenExpiresAt
      ? new Date(row.squareTokenExpiresAt * 1000)
      : null,
  };
}

export class ClientRegistry {
  /** In-memory cache: agentId → ClientConfig */
  private cache = new Map<string, ClientConfig>();

  /** Look up a client by agent_id. Throws ClientNotFoundError if not registered. */
  async getByAgentId(agentId: string): Promise<ClientConfig> {
    if (this.cache.has(agentId)) {
      return this.cache.get(agentId)!;
    }

    const [row] = await db
      .select()
      .from(clients)
      .where(eq(clients.retellAgentId, agentId));

    if (!row) {
      logger.warn('Unknown agent_id received', { agentId });
      throw new ClientNotFoundError(agentId);
    }

    const client = mapRow(row);
    this.cache.set(agentId, client);
    return client;
  }

  /** Persist updated Square tokens after OAuth or token refresh. Clears cache entry. */
  async updateSquareTokens(
    agentId: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
      merchantId: string;
      locationId: string;
    },
  ): Promise<void> {
    await db.update(clients)
      .set({
        squareAccessToken: tokens.accessToken,
        squareRefreshToken: tokens.refreshToken,
        squareTokenExpiresAt: Math.floor(tokens.expiresAt.getTime() / 1000),
        squareMerchantId: tokens.merchantId,
        squareLocationId: tokens.locationId,
      })
      .where(eq(clients.retellAgentId, agentId));

    // Evict stale cache entry so next lookup reads fresh tokens.
    this.cache.delete(agentId);
    logger.info('Square tokens updated', { agentId });
  }

  /** Create or update a client row. Used during OAuth to register the business. */
  async upsertClient(data: {
    agentId: string;
    businessName: string;
  }): Promise<void> {
    const [existing] = await db
      .select()
      .from(clients)
      .where(eq(clients.retellAgentId, data.agentId));

    if (!existing) {
      await db.insert(clients)
        .values({
          retellAgentId: data.agentId,
          businessName: data.businessName,
        });
      logger.info('New client registered', { agentId: data.agentId, businessName: data.businessName });
    }
  }

  /** Invalidate a single cache entry (useful after token refresh). */
  invalidate(agentId: string): void {
    this.cache.delete(agentId);
  }
}

/** Singleton — one instance shared across the whole app. */
export const clientRegistry = new ClientRegistry();
