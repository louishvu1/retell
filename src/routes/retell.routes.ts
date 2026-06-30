/**
 * routes/retell.routes.ts
 * Handles inbound webhook calls from Retell AI.
 *
 * POST /webhook/retell
 *   1. Verifies the Retell webhook signature (reject if invalid).
 *   2. Reads the agent_id from the request body.
 *   3. Looks up the client in ClientRegistry.
 *   4. Dispatches to RetellFunctionHandler based on the function name.
 *   5. Returns the function result to Retell.
 *
 * Implementation: next session.
 */
export {};
