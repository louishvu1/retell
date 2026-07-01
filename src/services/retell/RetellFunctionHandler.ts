/**
 * services/retell/RetellFunctionHandler.ts
 * Dispatches inbound Retell function calls to the correct booking operation.
 *
 * This is the brain of the booking conversation. A single call from a customer
 * may trigger multiple function calls in sequence:
 *   get_services → get_staff → check_availability → create_booking
 *
 * Session state:
 *   Retell sends the same call_id for every function call within one conversation.
 *   We use an in-memory Map to accumulate state (selected service, staff, time)
 *   across these calls so we don't ask the caller to repeat themselves.
 *   State is automatically cleaned up after a booking is confirmed.
 *
 * Return value:
 *   Any JSON-serialisable value. Retell converts it to a string and feeds it
 *   to the LLM as the function result.
 */

import type { ClientConfig } from '../clients/client.types';
import type { RetellFunctionCallPayload, RetellFunctionName } from './retell.types';
import { bookingRouter } from '../booking/BookingRouter';
import { fuzzyMatchStaff } from '../../utils/fuzzyMatch';
import { logger } from '../../utils/logger';
import { SlotUnavailableError, SquareApiError } from '../../utils/errors';

interface BookingSessionState {
  selectedServiceId?: string;
  selectedStaffId?: string;
  selectedStartTime?: string;
}

export class RetellFunctionHandler {
  /** In-memory session state keyed by Retell call_id. */
  private sessions = new Map<string, BookingSessionState>();

  private getSession(callId: string): BookingSessionState {
    if (!this.sessions.has(callId)) {
      this.sessions.set(callId, {});
    }
    return this.sessions.get(callId)!;
  }

  /**
   * Main dispatch method. Called by the webhook route for every function call.
   * Returns the value that will be sent back to Retell as the function result.
   */
  async handle(
    payload: RetellFunctionCallPayload,
    client: ClientConfig,
  ): Promise<unknown> {
    const callId = payload.call.call_id;
    const fnName = payload.name as RetellFunctionName;
    const session = this.getSession(callId);

    logger.info('Retell function call', { callId, function: fnName, agentId: client.retellAgentId });

    try {
      switch (fnName) {
        case 'get_services':
          return await this.handleGetServices(client);

        case 'get_staff':
          return await this.handleGetStaff(client, payload.args, session);

        case 'check_availability':
          return await this.handleCheckAvailability(client, payload.args, session);

        case 'create_booking':
          return await this.handleCreateBooking(client, payload.args, session, callId);

        default:
          logger.warn('Unknown function name received from Retell', { fnName });
          return { error: `Unknown function: ${fnName}` };
      }
    } catch (err) {
      return this.handleError(err, fnName);
    }
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  private async handleGetServices(client: ClientConfig) {
    const services = await bookingRouter.listServices(client);
    return { services };
  }

  private async handleGetStaff(
    client: ClientConfig,
    args: Record<string, unknown>,
    session: BookingSessionState,
  ) {
    const staff = await bookingRouter.listStaff(client);
    const requestedName = args['staff_name'] as string | undefined;

    if (!requestedName) {
      return { staff };
    }

    // Caller named a specific person — try fuzzy match.
    const result = fuzzyMatchStaff(requestedName, staff);

    if (result.match && result.confidence >= 0.85) {
      session.selectedStaffId = result.match.id;
      return {
        staff,
        matched_staff: result.match,
        confidence: result.confidence,
        message: result.ambiguous
          ? `Found a possible match: ${result.match.name}. Please confirm.`
          : `Matched staff member: ${result.match.name}`,
      };
    }

    if (result.match && result.confidence >= 0.5) {
      return {
        staff,
        possible_match: result.match,
        confidence: result.confidence,
        message: `Did the caller mean ${result.match.name}?`,
      };
    }

    return {
      staff,
      message: `No match found for "${requestedName}". Please confirm which staff member the caller wants.`,
    };
  }

  private async handleCheckAvailability(
    client: ClientConfig,
    args: Record<string, unknown>,
    session: BookingSessionState,
  ) {
    // Accumulate context into session.
    if (args['service_id']) session.selectedServiceId = args['service_id'] as string;
    if (args['staff_id']) session.selectedStaffId = args['staff_id'] as string;

    const serviceId = session.selectedServiceId ?? (args['service_id'] as string);
    const preferredDate = args['preferred_date'] as string;

    if (!serviceId) {
      return { error: 'service_id is required to check availability.' };
    }
    if (!preferredDate) {
      return { error: 'preferred_date (YYYY-MM-DD) is required.' };
    }

    const slots = await bookingRouter.getAvailability(client, {
      serviceId,
      staffId: session.selectedStaffId,
      preferredDate,
    });

    return { available_slots: slots };
  }

  private async handleCreateBooking(
    client: ClientConfig,
    args: Record<string, unknown>,
    session: BookingSessionState,
    callId: string,
  ) {
    // Merge any new info from args into session.
    if (args['service_id']) session.selectedServiceId = args['service_id'] as string;
    if (args['staff_id']) session.selectedStaffId = args['staff_id'] as string;
    if (args['start_time']) session.selectedStartTime = args['start_time'] as string;

    const serviceId = session.selectedServiceId;
    const staffId = session.selectedStaffId;
    const startTime = session.selectedStartTime;
    const customerName = args['customer_name'] as string | undefined;
    const customerPhone = args['customer_phone'] as string | undefined;
    const customerEmail = args['customer_email'] as string | undefined;

    if (!serviceId || !staffId || !startTime || !customerName || !customerPhone) {
      return {
        error:
          'Missing required booking details. Need: service_id, staff_id, start_time, customer_name, customer_phone.',
        received: { serviceId, staffId, startTime, customerName, customerPhone },
      };
    }

    const confirmation = await bookingRouter.createBooking(client, {
      serviceId,
      staffId,
      startTime,
      customerName,
      customerPhone,
      customerEmail,
    });

    // Clean up session after a successful booking.
    this.sessions.delete(callId);

    return {
      confirmation,
      message: `Booking confirmed! Reference: ${confirmation.bookingId}. Appointment with ${confirmation.staffName} on ${confirmation.startTime}.`,
    };
  }

  // ─── Error handling ───────────────────────────────────────────────────────

  private handleError(err: unknown, fnName: string): { error: string } {
    if (err instanceof SlotUnavailableError) {
      return {
        error:
          'That time slot is no longer available. Please ask the customer for another time.',
      };
    }

    if (err instanceof SquareApiError) {
      logger.error('Square API error in function handler', {
        function: fnName,
        code: err.squareErrorCode,
        message: err.message,
      });
      return {
        error: `Booking system error (${err.squareErrorCode}). Please try again or offer an alternative.`,
      };
    }

    logger.error('Unexpected error in function handler', {
      function: fnName,
      error: String(err),
    });
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export const retellFunctionHandler = new RetellFunctionHandler();
