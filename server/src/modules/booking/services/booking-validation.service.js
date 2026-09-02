import {
    getCourtWithFacility,
    getCourtOperatingHoursForDay,
    findMaintenanceOverlap,
    findBookingOverlap,
} from '../../../dao/booking.dao.js';
import { parseDateTime, isTimeWithinOperatingHours } from '../../../utils/booking.utils.js';

/**
 * Custom application error with HTTP status code.
 */
export class BookingValidationError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'BookingValidationError';
        this.statusCode = statusCode;
    }
}

/**
 * Validates all prerequisites, business constraints, operating hours, maintenance windows,
 * and double-booking collision rules for creating a booking.
 *
 * @param {object} params
 * @param {string} [params.facilityId] - Optional facility UUID
 * @param {string} params.courtId - Court UUID
 * @param {string} params.bookingDate - Date in DD-MM-YYYY, DDMMYYYY, or YYYY-MM-DD
 * @param {string} params.startTime - Time in HH:mm or HH:mm:ss
 * @param {string} params.endTime - Time in HH:mm or HH:mm:ss
 * @returns {Promise<{ court: object, facility: object, startDateTime: Date, endDateTime: Date }>}
 */
export async function validateBookingPrerequisites({
    facilityId,
    courtId,
    bookingDate,
    startTime,
    endTime,
}) {
    if (!courtId) {
        throw new BookingValidationError('Court ID is required', 400);
    }
    if (!bookingDate || !startTime || !endTime) {
        throw new BookingValidationError('bookingDate, startTime, and endTime are required', 400);
    }

    // 1. Parse dates and times
    let startDateTime;
    let endDateTime;
    try {
        startDateTime = parseDateTime(bookingDate, startTime);
        endDateTime = parseDateTime(bookingDate, endTime);
    } catch (parseErr) {
        throw new BookingValidationError(parseErr.message, 400);
    }

    // 2. Validate start before end
    if (endDateTime.getTime() <= startDateTime.getTime()) {
        throw new BookingValidationError('End time must be after start time', 400);
    }

    // 3. Past date/time rejection
    const now = new Date();
    if (startDateTime.getTime() <= now.getTime()) {
        throw new BookingValidationError('Cannot book a slot in the past', 400);
    }

    // 4. Validate Court & Facility existence and status
    const courtRecord = await getCourtWithFacility(courtId);
    if (!courtRecord || !courtRecord.court) {
        throw new BookingValidationError('Court not found', 404);
    }

    const { court, facility } = courtRecord;

    if (facilityId && court.facilityId !== facilityId) {
        throw new BookingValidationError('Court does not belong to the specified facility', 400);
    }

    if (!court.isActive) {
        throw new BookingValidationError('Court is not available for booking', 400);
    }

    if (!facility || facility.deletedAt !== null || facility.status !== 'APPROVED') {
        throw new BookingValidationError('Facility is not available for booking', 400);
    }

    // 5. Validate Operating Hours
    const dayOfWeek = startDateTime.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const operatingHours = await getCourtOperatingHoursForDay(courtId, dayOfWeek);

    if (operatingHours) {
        if (operatingHours.isClosed) {
            throw new BookingValidationError('Court is closed on this day', 400);
        }

        if (operatingHours.startTime && operatingHours.endTime) {
            const isWithin = isTimeWithinOperatingHours(
                startTime,
                endTime,
                operatingHours.startTime,
                operatingHours.endTime,
            );
            if (!isWithin) {
                throw new BookingValidationError(
                    'Requested time is outside court operating hours',
                    400,
                );
            }
        }
    }

    // 6. Maintenance Window Collision Check
    const maintenanceConflict = await findMaintenanceOverlap(courtId, startDateTime, endDateTime);
    if (maintenanceConflict) {
        throw new BookingValidationError(
            'Court is under scheduled maintenance during this time',
            409,
        );
    }

    // 7. Double-Booking Collision Check
    const doubleBookingConflict = await findBookingOverlap(courtId, startDateTime, endDateTime);
    if (doubleBookingConflict) {
        throw new BookingValidationError('Court is already booked for the selected time slot', 409);
    }

    return {
        court,
        facility,
        startDateTime,
        endDateTime,
    };
}
