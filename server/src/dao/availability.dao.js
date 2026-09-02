import { db } from '../config/database.config.js';
import { courtOperatingHours } from '../db/schema/court_operating_hours.schema.js';
import { eq, and, asc, sql } from 'drizzle-orm';

/**
 * Get 7-day operating hours for a court
 * @param {string} courtId
 */
export async function getOperatingHours(courtId) {
    return await db
        .select()
        .from(courtOperatingHours)
        .where(eq(courtOperatingHours.courtId, courtId))
        .orderBy(asc(courtOperatingHours.dayOfWeek));
}

/**
 * Get operating hours for a specific day
 * @param {string} courtId
 * @param {number} dayOfWeek
 */
export async function getOperatingHoursForDay(courtId, dayOfWeek) {
    const [record] = await db
        .select()
        .from(courtOperatingHours)
        .where(
            and(
                eq(courtOperatingHours.courtId, courtId),
                eq(courtOperatingHours.dayOfWeek, dayOfWeek),
            ),
        );
    return record || null;
}

/**
 * Upsert weekly operating hours for a court in a transaction
 * @param {string} courtId
 * @param {Array<{ dayOfWeek: number, startTime: string|null, endTime: string|null, isClosed: boolean }>} schedules
 */
export async function upsertWeeklyOperatingHours(courtId, schedules) {
    return await db.transaction(async (tx) => {
        const results = [];
        for (const schedule of schedules) {
            const isClosed = Boolean(schedule.isClosed);
            const [saved] = await tx
                .insert(courtOperatingHours)
                .values({
                    courtId,
                    dayOfWeek: schedule.dayOfWeek,
                    startTime: isClosed ? null : schedule.startTime,
                    endTime: isClosed ? null : schedule.endTime,
                    isClosed,
                })
                .onConflictDoUpdate({
                    target: [courtOperatingHours.courtId, courtOperatingHours.dayOfWeek],
                    set: {
                        startTime: isClosed ? null : schedule.startTime,
                        endTime: isClosed ? null : schedule.endTime,
                        isClosed,
                    },
                })
                .returning();
            results.push(saved);
        }

        return results.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
}

/**
 * Update operating hours for a specific day
 * @param {string} courtId
 * @param {number} dayOfWeek
 * @param {object} updates
 */
export async function updateDayOperatingHours(
    courtId,
    dayOfWeek,
    { startTime, endTime, isClosed },
) {
    const closed = Boolean(isClosed);
    const [updated] = await db
        .insert(courtOperatingHours)
        .values({
            courtId,
            dayOfWeek,
            startTime: closed ? null : startTime,
            endTime: closed ? null : endTime,
            isClosed: closed,
        })
        .onConflictDoUpdate({
            target: [courtOperatingHours.courtId, courtOperatingHours.dayOfWeek],
            set: {
                startTime: closed ? null : startTime,
                endTime: closed ? null : endTime,
                isClosed: closed,
            },
        })
        .returning();

    return updated || null;
}

/**
 * Check if a given start and end time fall within the court's operating hours for that day
 * @param {string} courtId
 * @param {Date} startTimeDate
 * @param {Date} endTimeDate
 * @returns {Promise<{ isWithin: boolean, reason?: string }>}
 */
export async function checkWithinOperatingHours(courtId, startTimeDate, endTimeDate) {
    const dayOfWeek = startTimeDate.getDay(); // 0 = Sunday ... 6 = Saturday
    const daySchedule = await getOperatingHoursForDay(courtId, dayOfWeek);

    if (!daySchedule) {
        return { isWithin: false, reason: 'No operating hours configured for this day' };
    }

    if (daySchedule.isClosed) {
        return { isWithin: false, reason: 'Court is closed on this day' };
    }

    // Convert Date to "HH:mm:ss" in local time for comparison
    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${pad(startTimeDate.getHours())}:${pad(startTimeDate.getMinutes())}:00`;
    const endStr = `${pad(endTimeDate.getHours())}:${pad(endTimeDate.getMinutes())}:00`;

    if (startStr < daySchedule.startTime || endStr > daySchedule.endTime) {
        return {
            isWithin: false,
            reason: `Requested time ${startStr} - ${endStr} falls outside operating hours (${daySchedule.startTime} - ${daySchedule.endTime})`,
        };
    }

    return { isWithin: true };
}
