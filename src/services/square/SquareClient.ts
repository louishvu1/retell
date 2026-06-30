/**
 * services/square/SquareClient.ts
 * Thin wrapper around the Square SDK that injects the correct access token
 * for a given client.
 *
 * Responsibilities:
 *   - Accept a client's Square access token.
 *   - Expose typed methods for the Square APIs we use
 *     (Catalog, Team, Bookings, Customers).
 *   - Handle token refresh transparently when a 401 is received.
 *   - Translate Square SDK errors into application-level errors.
 *
 * Implementation: next session.
 */
export {};
