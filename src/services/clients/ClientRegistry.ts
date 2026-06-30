/**
 * services/clients/ClientRegistry.ts
 * Looks up client configuration by Retell agent ID.
 *
 * This is how the backend knows WHICH business it's talking to on each
 * incoming webhook. Retell always sends the agent_id; we use that to
 * find the client's Square credentials and configuration.
 *
 * Responsibilities:
 *   - Query the database for a client by agent_id.
 *   - Throw a clear error if no client is found (unknown agent).
 *   - Cache results in memory for the lifetime of the process (optional
 *     optimisation — avoids a DB hit on every webhook call).
 *
 * Implementation: next session.
 */
export {};
