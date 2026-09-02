import { calculateDurationAndPrice } from '../../../utils/booking.utils.js';

/**
 * Calculates booking duration and pricing snapshot for a court.
 *
 * @param {object} court - Court database record with priceAmount and priceCurrency
 * @param {Date} startDateTime - Slot start time
 * @param {Date} endDateTime - Slot end time
 * @returns {{ durationMinutes: number, durationHours: number, priceAmount: string, priceCurrency: string, totalAmount: string, totalCurrency: string }}
 */
export function calculateBookingPrice(court, startDateTime, endDateTime) {
    const hourlyRate = court.priceAmount;
    const currency = court.priceCurrency || 'INR';

    const pricing = calculateDurationAndPrice(startDateTime, endDateTime, hourlyRate);

    return {
        durationMinutes: pricing.durationMinutes,
        durationHours: pricing.durationHours,
        priceAmount: pricing.priceAmount,
        priceCurrency: currency,
        totalAmount: pricing.totalAmount,
        totalCurrency: currency,
    };
}
