/**
 * services/clients/client.types.ts
 * The core data model for a Nott AI client (a business).
 */

export type BookingProvider = 'square'; // extensible: | 'acuity' | 'mindbody'

/** A registered business client. Loaded from the database. */
export interface ClientConfig {
  /** Internal database ID. */
  id: number;
  /** The business name (e.g. "Los Cab Sports Village"). */
  businessName: string;
  /** The Retell agent ID assigned to this business. Used as a lookup key. */
  retellAgentId: string;
  /** Which booking system this client uses. */
  bookingProvider: BookingProvider;

  // Square-specific fields (nullable if provider != 'square')
  squareMerchantId: string | null;
  squareAccessToken: string | null;
  squareRefreshToken: string | null;
  squareTokenExpiresAt: Date | null;
  squareLocationId: string | null;
}
