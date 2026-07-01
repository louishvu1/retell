/**
 * services/retell/retell.types.ts
 * Types for inbound Retell webhook payloads.
 *
 * Verified against https://docs.retellai.com/build/single-multi-prompt/custom-function
 *
 * REAL payload shape (when "Payload: args only" is OFF — our default):
 *   { name, args, call: { call_id, agent_id, ... } }
 *
 * The original stub was wrong: call_id/agent_id are nested inside `call`,
 * and arguments is called `args`.
 */

/** Partial shape of the call object Retell includes for context. */
export interface RetellCallContext {
  /** Stable across all function calls in one conversation. Used for session state. */
  call_id: string;
  /** The Retell agent handling this call. Used to look up the business client. */
  agent_id: string;
  /** Live transcript up to the moment this function was triggered. */
  transcript?: string;
  [key: string]: unknown;
}

/** Payload Retell POSTs to our webhook for each custom function call. */
export interface RetellFunctionCallPayload {
  /** The name of the function the agent wants to invoke. */
  name: string;
  /** The arguments the LLM resolved for this call. Shape varies by function name. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>;
  /** Context about the ongoing call, including call_id and agent_id. */
  call: RetellCallContext;
}

/** Function names the Retell agent is configured to call. */
export type RetellFunctionName =
  | 'get_services'
  | 'get_staff'
  | 'check_availability'
  | 'create_booking';
