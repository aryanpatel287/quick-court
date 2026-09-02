import cron from 'node-cron';
import { getPastConfirmedBookings, batchCompleteBookings } from '../dao/booking.dao.js';

/**
 * Checks for confirmed bookings whose end_time has passed and transitions them to COMPLETED.
 * @returns {Promise<number>} Number of completed bookings
 */
export async function runBookingStatusCompletion() {
    try {
        const pastConfirmed = await getPastConfirmedBookings(new Date());
        if (!pastConfirmed || pastConfirmed.length === 0) {
            return 0;
        }

        const bookingIds = pastConfirmed.map((b) => b.id);
        const completedCount = await batchCompleteBookings(bookingIds);
        return completedCount;
    } catch (error) {
        console.error('[BookingCron] Auto-completion job failed with error:', error);
        throw error;
    }
}

// Schedule to run every 5 minutes
cron.schedule(
    '*/5 * * * *',
    async () => {
        try {
            console.log('[BookingCron] Running booking status auto-completion check...');
            const count = await runBookingStatusCompletion();
            if (count > 0) {
                console.log(`[BookingCron] Auto-completed ${count} expired bookings.`);
            }
        } catch (err) {
            console.error('[BookingCron] Cron execution error:', err);
        }
    },
    {
        timezone: 'Asia/Kolkata',
    },
);
