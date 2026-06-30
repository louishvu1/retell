/**
 * routes/oauth.routes.ts
 * Handles the Square OAuth 2.0 connection flow for client onboarding.
 *
 * GET /oauth/square/start?agent_id=xxx
 *   Redirects the business owner to Square's OAuth authorisation page.
 *   Stores agent_id in the OAuth state parameter so we can link it on callback.
 *
 * GET /oauth/square/callback?code=xxx&state=xxx
 *   Exchanges the authorisation code for access + refresh tokens.
 *   Stores tokens in the DB linked to the agent_id from state.
 *   Shows a success page to the business owner.
 *
 * Implementation: next session.
 */
export {};
