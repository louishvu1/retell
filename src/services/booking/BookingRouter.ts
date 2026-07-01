/**
 * services/booking/BookingRouter.ts
 * Provider-agnostic booking interface. The only booking abstraction the
 * rest of the application touches.
 *
 * Selecting a provider works like this:
 *   1. The webhook gives us the client's bookingProvider ('square').
 *   2. BookingRouter.getProvider(client) returns the correct adapter.
 *   3. The adapter implements BookingProvider, so the caller doesn't care
 *      whether it's Square or anything else.
 *
 * Adding a new provider (e.g. Acuity):
 *   1. Create src/services/booking/providers/AcuityBookingAdapter.ts
 *   2. Implement BookingProvider
 *   3. Add a case in getProvider() below
 *   — Nothing else in the codebase changes.
 */

import type {
  AvailabilityRequest,
  AvailableSlot,
  BookingConfirmation,
  BookingRequest,
  Service,
  StaffMember,
} from './booking.types';
import type { ClientConfig } from '../clients/client.types';
import { SquareBookingAdapter } from './providers/SquareBookingAdapter';
import { createSquareClient } from '../square/SquareClient';
import { squareOAuthService } from '../square/SquareOAuthService';

/** Every booking adapter must implement this interface. */
export interface BookingProvider {
  listServices(): Promise<Service[]>;
  listStaff(): Promise<StaffMember[]>;
  getAvailability(req: AvailabilityRequest): Promise<AvailableSlot[]>;
  createBooking(req: BookingRequest): Promise<BookingConfirmation>;
}

export class BookingRouter {
  /**
   * Resolve the correct BookingProvider for a given client.
   * Handles token refresh before returning the adapter.
   */
  async getProvider(client: ClientConfig): Promise<BookingProvider> {
    switch (client.bookingProvider) {
      case 'square': {
        if (!client.squareLocationId) {
          throw new Error(
            `Client ${client.retellAgentId} has not completed Square OAuth (no locationId).`,
          );
        }
        // getValidAccessToken refreshes the token automatically if it's expiring.
        const accessToken = await squareOAuthService.getValidAccessToken(
          client.retellAgentId,
        );
        const squareClient = createSquareClient(accessToken);
        return new SquareBookingAdapter(squareClient, client.squareLocationId);
      }

      default:
        throw new Error(
          `Unknown booking provider: ${client.bookingProvider as string}`,
        );
    }
  }

  // ─── Convenience methods that resolve the provider and delegate ───────────

  async listServices(client: ClientConfig): Promise<Service[]> {
    const provider = await this.getProvider(client);
    return provider.listServices();
  }

  async listStaff(client: ClientConfig): Promise<StaffMember[]> {
    const provider = await this.getProvider(client);
    return provider.listStaff();
  }

  async getAvailability(
    client: ClientConfig,
    req: AvailabilityRequest,
  ): Promise<AvailableSlot[]> {
    const provider = await this.getProvider(client);
    return provider.getAvailability(req);
  }

  async createBooking(
    client: ClientConfig,
    req: BookingRequest,
  ): Promise<BookingConfirmation> {
    const provider = await this.getProvider(client);
    return provider.createBooking(req);
  }
}

export const bookingRouter = new BookingRouter();
