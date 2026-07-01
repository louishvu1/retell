/**
 * services/booking/booking.types.ts
 * Provider-agnostic types used across the booking layer.
 * The BookingRouter and all adapters speak this language.
 *
 * Implementation: next session.
 */

/** A service offered by the business (e.g. "Gel Manicure"). */
export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

/** A staff member who can perform services. */
export interface StaffMember {
  id: string;
  name: string;
}

/** A single available appointment slot. */
export interface AvailableSlot {
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  staffId: string;
  staffName: string;
}

/** Input to check available slots. */
export interface AvailabilityRequest {
  serviceId: string;
  staffId?: string;       // Optional — if customer has a preference
  preferredDate: string;  // YYYY-MM-DD
}

/** Input to create a booking. */
export interface BookingRequest {
  serviceId: string;
  staffId: string;
  startTime: string;  // ISO 8601
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}

/** Result of a confirmed booking. */
export interface BookingConfirmation {
  bookingId: string;
  staffName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
}
