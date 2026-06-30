/**
 * services/retell/RetellFunctionHandler.ts
 * Dispatches inbound Retell function calls to the correct booking operation.
 *
 * This is the brain of the booking conversation. It:
 *   1. Receives a validated RetellFunctionCallPayload.
 *   2. Looks up the correct BookingProvider via BookingRouter.
 *   3. Calls the appropriate provider method.
 *   4. Formats the result as a string for the Retell LLM to read.
 *
 * Supported functions:
 *   get_services        → BookingRouter.listServices()
 *   get_staff           → BookingRouter.listStaff()
 *   check_availability  → BookingRouter.getAvailability()
 *   create_booking      → BookingRouter.createBooking()
 *
 * Implementation: next session.
 */
export {};
