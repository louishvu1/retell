/**
 * services/square/SquareOAuthService.ts
 * Handles Square OAuth 2.0 token exchange, storage, and refresh.
 *
 * Responsibilities:
 *   - Build the Square OAuth authorisation URL.
 *   - Exchange an authorisation code for access + refresh tokens.
 *   - Persist tokens to the database against the client's agent_id.
 *   - Automatically refresh tokens before they expire (Square tokens
 *     expire every 30 days; refresh tokens last 1 year).
 *
 * Implementation: next session.
 */
export {};
