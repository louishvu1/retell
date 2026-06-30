/**
 * services/retell/retell.types.ts
 * Types for inbound Retell webhook payloads.
 *
 * These reflect the actual shape of Retell's function-call webhook.
 * Verify against https://docs.retellai.com before implementing.
 */

/** Payload Retell sends when calling a custom function. */
export interface RetellFunctionCallPayload {
  /** Unique ID for the call session. Used to maintain session state. */
  call_id: string;
  /** The Retell agent that triggered this call. Used to identify the client. */
  agent_id: string;
  /** The name of the function the agent wants to call. */
  name: string;
  /** The arguments the agent passed to the function. Shape varies by function. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arguments: Record<string, any>;
}

/** What we return to Retell after processing a function call. */
export interface RetellFunctionResult {
  /** A string the LLM will receive as the function result. JSON-stringify complex objects. */
  result: string;
}

/** Function names the Retell agent is configured to call. */
export type RetellFunctionName =
  | 'get_services'
  | 'get_staff'
  | 'check_availability'
  | 'create_booking';
