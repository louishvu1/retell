/**
 * services/booking/BookingRouter.ts
 * The provider-agnostic booking interface.
 *
 * The BookingRouter is the ONLY thing that the rest of the application
 * talks to for booking operations. It does not know or care whether the
 * underlying provider is Square, Acuity, Mindbody, or anything else.
 *
 * Each client has an associated provider (currently always "square").
 * The router selects the correct adapter and delegates.
 *
 * Adding a new booking provider = adding a new adapter in ./providers/
 * and registering it here. Nothing else changes.
 *
 * Implementation: next session.
 */

import type {
  AvailabilityRequest,
  AvailableSlot,
  BookingConfirmation,
  BookingRequest,
  Service,
  StaffMember,
} from './booking.types';

/** Every booking adapter must implement this interface. */
export interface BookingProvider {
  listServices(): Promise<Service[]>;
  listStaff(): Promise<StaffMember[]>;
  getAvailability(req: AvailabilityRequest): Promise<AvailableSlot[]>;
  createBooking(req: BookingRequest): Promise<BookingConfirmation>;
}

export class BookingRouter {
  // Implementation: next session.
}
