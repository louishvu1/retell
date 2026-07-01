/**
 * services/booking/providers/SquareBookingAdapter.ts
 * Implements BookingProvider using the Square Appointments API.
 *
 * This is the ONLY file in the codebase that contains Square-specific logic
 * in the booking layer. Everything above this layer is provider-agnostic.
 *
 * Square APIs used:
 *   catalogApi   → list appointment services
 *   bookingsApi  → list bookable staff, check availability, create booking
 *   customersApi → find or create customer
 *
 * Important: Square service IDs are ITEM_VARIATION IDs (not ITEM IDs).
 * The LLM receives variation IDs as "service IDs" and passes them back in
 * subsequent function calls. This is transparent to the caller.
 */

import type { Client as SquareSdkClient } from 'square';
import type { BookingProvider } from '../BookingRouter';
import type {
  AvailabilityRequest,
  AvailableSlot,
  BookingConfirmation,
  BookingRequest,
  Service,
  StaffMember,
} from '../booking.types';
import { SlotUnavailableError, SquareApiError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

/** Square segment filter shape for availability search. */
interface SegmentFilter {
  serviceVariationId: string;
  teamMemberIdFilter?: { any: string[] };
}

/** Square catalog variation extended with appointment-specific data. */
interface VariationDataWithAppointment {
  appointmentData?: { durationMinutes?: number };
  priceMoney?: { amount?: bigint | number };
  name?: string;
}

export class SquareBookingAdapter implements BookingProvider {
  constructor(
    private readonly client: SquareSdkClient,
    private readonly locationId: string,
  ) {}

  // ─── listServices ──────────────────────────────────────────────────────────

  async listServices(): Promise<Service[]> {
    const { result } = await this.client.catalogApi
      .listCatalog(undefined, 'ITEM')
      .catch((err: unknown) => this.handleSquareError(err));

    const items = (result.objects ?? []).filter(
      obj =>
        obj.type === 'ITEM' &&
        obj.itemData?.productType === 'APPOINTMENTS_SERVICE' &&
        !obj.isDeleted,
    );

    return items.flatMap(item =>
      (item.itemData?.variations ?? []).map(variation => ({
        // We use the VARIATION ID as our service ID throughout.
        id: variation.id!,
        name: item.itemData?.variations && item.itemData.variations.length > 1
          ? `${item.itemData?.name ?? 'Service'} (${variation.itemVariationData?.name ?? ''})`
          : (item.itemData?.name ?? 'Service'),
        // Duration: Square stores this in the variation's appointment data.
        // If the field isn't present (older Square plans), default to 60 min.
        durationMinutes:
          (variation.itemVariationData as unknown as VariationDataWithAppointment)
            ?.appointmentData?.durationMinutes ?? 60,
        priceCents: Number(variation.itemVariationData?.priceMoney?.amount ?? 0),
      })),
    );
  }

  // ─── listStaff ────────────────────────────────────────────────────────────

  async listStaff(): Promise<StaffMember[]> {
    const { result } = await this.client.bookingsApi
      .listTeamMemberBookingProfiles({
        bookableOnly: true,
        locationId: this.locationId,
      })
      .catch((err: unknown) => this.handleSquareError(err));

    return (result.teamMemberBookingProfiles ?? [])
      .filter(p => p.isBookable)
      .map(p => ({
        id: p.teamMemberId!,
        name: p.displayName ?? 'Staff Member',
      }));
  }

  // ─── getAvailability ──────────────────────────────────────────────────────

  async getAvailability(req: AvailabilityRequest): Promise<AvailableSlot[]> {
    // Build a full-day range for the preferred date.
    const startAt = `${req.preferredDate}T00:00:00Z`;
    const endAt   = `${req.preferredDate}T23:59:59Z`;

    const segmentFilter: SegmentFilter = { serviceVariationId: req.serviceId };
    if (req.staffId) {
      segmentFilter.teamMemberIdFilter = { any: [req.staffId] };
    }

    const { result } = await this.client.bookingsApi
      .searchAvailability({
        query: {
          filter: {
            startAtRange: { startAt, endAt },
            locationId: this.locationId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            segmentFilters: [segmentFilter as any],
          },
        },
      })
      .catch((err: unknown) => this.handleSquareError(err));

    // Build a staff ID → name lookup from the bookable profiles.
    const staffMap = await this.buildStaffMap();

    return (result.availabilities ?? []).map(slot => {
      const segment = slot.appointmentSegments?.[0];
      const staffId = segment?.teamMemberId ?? '';
      return {
        startTime: slot.startAt!,
        endTime: '',   // Square availability search doesn't return endTime directly
        staffId,
        staffName: staffMap.get(staffId) ?? staffId,
      };
    });
  }

  // ─── createBooking ────────────────────────────────────────────────────────

  async createBooking(req: BookingRequest): Promise<BookingConfirmation> {
    // 1. Find or create the customer.
    const customerId = await this.findOrCreateCustomer(req);

    // 2. Look up the catalog variation to get the current version (required by Square).
    const { result: catalogResult } = await this.client.catalogApi
      .retrieveCatalogObject(req.serviceId)
      .catch((err: unknown) => this.handleSquareError(err));

    const variation = catalogResult.object;
    if (!variation) {
      throw new SquareApiError('CATALOG_NOT_FOUND', `Service variation ${req.serviceId} not found.`);
    }

    const serviceVariationVersion = variation.version ?? BigInt(0);
    const durationMinutes =
      (variation.itemVariationData as unknown as VariationDataWithAppointment)
        ?.appointmentData?.durationMinutes ?? 60;

    // 3. Create the booking.
    const { result } = await this.client.bookingsApi
      .createBooking({
        booking: {
          startAt: req.startTime,
          locationId: this.locationId,
          customerId,
          appointmentSegments: [
            {
              durationMinutes,
              serviceVariationId: req.serviceId,
              serviceVariationVersion,
              teamMemberId: req.staffId,
            },
          ],
        },
      })
      .catch(err => {
        // Square returns UNAVAILABLE when the slot was taken between availability check and booking.
        if (this.isSquareApiError(err) && err.errors?.some(e => e.code === 'UNAVAILABLE')) {
          throw new SlotUnavailableError();
        }
        return this.handleSquareError(err);
      });

    const booking = result.booking!;
    const staffMap = await this.buildStaffMap();

    return {
      bookingId: booking.id!,
      staffName: staffMap.get(req.staffId) ?? req.staffId,
      serviceName: req.serviceId, // The LLM already knows the service name from earlier in the conversation
      startTime: booking.startAt!,
      endTime: '', // Calculated from startTime + durationMinutes by the LLM if needed
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Search for an existing customer by phone. Create one if not found.
   * Returns the Square customer ID.
   */
  private async findOrCreateCustomer(req: BookingRequest): Promise<string> {
    // Try to find an existing customer by phone number.
    try {
      const { result } = await this.client.customersApi.searchCustomers({
        query: {
          filter: {
            phoneNumber: { exact: req.customerPhone },
          },
        },
      });

      if (result.customers && result.customers.length > 0) {
        logger.debug('Found existing Square customer', { id: result.customers[0].id });
        return result.customers[0].id!;
      }
    } catch (err) {
      // Search failed — fall through to create.
      logger.warn('Customer search failed, will create new', { error: String(err) });
    }

    // Split name into given/family.
    const parts = req.customerName.trim().split(/\s+/);
    const givenName = parts[0] ?? req.customerName;
    const familyName = parts.slice(1).join(' ') || undefined;

    const { result } = await this.client.customersApi
      .createCustomer({
        givenName,
        familyName,
        phoneNumber: req.customerPhone,
        emailAddress: req.customerEmail,
      })
      .catch((err: unknown) => this.handleSquareError(err));

    logger.debug('Created new Square customer', { id: result.customer?.id });
    return result.customer!.id!;
  }

  /** Build a Map of teamMemberId → displayName from bookable profiles. */
  private async buildStaffMap(): Promise<Map<string, string>> {
    const staff = await this.listStaff();
    return new Map(staff.map(s => [s.id, s.name]));
  }

  /** Type guard for Square SDK ApiError objects. */
  private isSquareApiError(err: unknown): err is { errors?: Array<{ code?: string }> } {
    return typeof err === 'object' && err !== null && 'errors' in err;
  }

  /** Translate Square SDK errors into our typed SquareApiError. */
  private handleSquareError(err: unknown): never {
    if (typeof err === 'object' && err !== null && 'errors' in err) {
      const squareErr = err as { errors?: Array<{ code?: string; detail?: string }> };
      const first = squareErr.errors?.[0];
      throw new SquareApiError(
        first?.code ?? 'UNKNOWN',
        first?.detail ?? String(err),
      );
    }
    throw err;
  }
}
