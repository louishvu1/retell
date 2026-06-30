/**
 * services/booking/providers/SquareBookingAdapter.ts
 * Implements BookingProvider using the Square Appointments API.
 *
 * Responsibilities:
 *   - Translate provider-agnostic BookingRequest / AvailabilityRequest
 *     into Square-specific API calls via SquareClient.
 *   - Translate Square API responses back into the provider-agnostic types.
 *   - Handle Square-specific error codes and translate to app errors.
 *
 * Square APIs used:
 *   - Catalog API   → list services and pricing
 *   - Team API      → list staff members
 *   - Bookings API  → check availability and create bookings
 *   - Customers API → look up or create customer records
 *
 * Implementation: next session.
 */
export {};
