/**
 * utils/errors.ts
 * Custom application error classes.
 *
 * Having typed errors lets us write clean catch blocks:
 *   catch (err) {
 *     if (err instanceof ClientNotFoundError) return res.status(404)...
 *     if (err instanceof SquareApiError) return res.status(502)...
 *   }
 */

/** Thrown when an incoming agent_id does not match any registered client. */
export class ClientNotFoundError extends Error {
  constructor(agentId: string) {
    super(`No client registered for agent_id: ${agentId}`);
    this.name = 'ClientNotFoundError';
  }
}

/** Thrown when the Square API returns an unexpected error. */
export class SquareApiError extends Error {
  constructor(
    public readonly squareErrorCode: string,
    message: string,
  ) {
    super(`Square API error [${squareErrorCode}]: ${message}`);
    this.name = 'SquareApiError';
  }
}

/** Thrown when a requested time slot is no longer available. */
export class SlotUnavailableError extends Error {
  constructor() {
    super('The requested appointment slot is no longer available.');
    this.name = 'SlotUnavailableError';
  }
}

/** Thrown when Retell webhook signature verification fails. */
export class WebhookAuthError extends Error {
  constructor() {
    super('Invalid Retell webhook signature.');
    this.name = 'WebhookAuthError';
  }
}
