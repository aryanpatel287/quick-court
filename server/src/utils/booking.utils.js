import crypto from 'crypto';

/**
 * Formats a Date object into DDMMYYYY format.
 * Example: 2nd Sept 2026 -> "02092026"
 *
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function formatDDMMYYYY(date = new Date()) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}${month}${year}`;
}

/**
 * Generates a unique human-readable booking reference.
 * Format: BK-DDMMYYYY-XXXXXX (e.g. BK-02092026-9F3A1B)
 *
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function generateBookingReference(date = new Date()) {
    const datePart = formatDDMMYYYY(date);
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `BK-${datePart}-${randomHex}`;
}

/**
 * Generates a simulated payment transaction reference.
 * Format: QC_PAY_DDMMYYYY_HEX (e.g. QC_PAY_02092026_8F4C1A91)
 *
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function generateTransactionReference(date = new Date()) {
    const datePart = formatDDMMYYYY(date);
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `QC_PAY_${datePart}_${randomHex}`;
}

/**
 * Parses a date string and time string into a valid Date object.
 * Supports date formats: DD-MM-YYYY, DD/MM/YYYY, DDMMYYYY, YYYY-MM-DD
 * Supports time formats: HH:mm, HH:mm:ss
 *
 * @param {string} dateStr
 * @param {string} timeStr
 * @returns {Date}
 */
export function parseDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) {
        throw new Error('Date string and time string are required');
    }

    const trimmedDate = String(dateStr).trim();
    const trimmedTime = String(timeStr).trim();

    let day, month, year;

    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedDate)) {
        // DD-MM-YYYY
        const parts = trimmedDate.split('-');
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedDate)) {
        // DD/MM/YYYY
        const parts = trimmedDate.split('/');
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
    } else if (/^\d{8}$/.test(trimmedDate)) {
        // DDMMYYYY
        day = parseInt(trimmedDate.substring(0, 2), 10);
        month = parseInt(trimmedDate.substring(2, 4), 10);
        year = parseInt(trimmedDate.substring(4, 8), 10);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
        // YYYY-MM-DD
        const parts = trimmedDate.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
    } else {
        throw new Error(
            `Invalid date format: ${dateStr}. Expected DD-MM-YYYY, DD/MM/YYYY, DDMMYYYY, or YYYY-MM-DD`,
        );
    }

    const timeParts = trimmedTime.split(':');
    if (timeParts.length < 2) {
        throw new Error(`Invalid time format: ${timeStr}. Expected HH:mm or HH:mm:ss`);
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = timeParts.length >= 3 ? parseInt(timeParts[2], 10) : 0;

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error(`Invalid time values in: ${timeStr}`);
    }

    const parsedDate = new Date(year, month - 1, day, hours, minutes, seconds, 0);
    if (isNaN(parsedDate.getTime())) {
        throw new Error(`Could not construct valid date from ${dateStr} ${timeStr}`);
    }

    return parsedDate;
}

/**
 * Converts a time string (HH:mm or HH:mm:ss) to total minutes from midnight.
 *
 * @param {string} timeStr
 * @returns {number}
 */
export function timeStringToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = String(timeStr).trim().split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
}

/**
 * Checks if a requested slot (startTime to endTime) falls completely within court operating hours.
 *
 * @param {string} slotStartTime - e.g. "10:00"
 * @param {string} slotEndTime - e.g. "12:00"
 * @param {string} openTime - e.g. "06:00:00"
 * @param {string} closeTime - e.g. "22:00:00"
 * @returns {boolean}
 */
export function isTimeWithinOperatingHours(slotStartTime, slotEndTime, openTime, closeTime) {
    const slotStartMin = timeStringToMinutes(slotStartTime);
    const slotEndMin = timeStringToMinutes(slotEndTime);
    const openMin = timeStringToMinutes(openTime);
    const closeMin = timeStringToMinutes(closeTime);

    return slotStartMin >= openMin && slotEndMin <= closeMin;
}

/**
 * Calculates duration in minutes and hours, and computes the total amount snapshot.
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {number|string} hourlyRate
 * @returns {{ durationMinutes: number, durationHours: number, priceAmount: string, totalAmount: string, currency: string }}
 */
export function calculateDurationAndPrice(startDate, endDate, hourlyRate) {
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (endMs <= startMs) {
        throw new Error('End time must be after start time');
    }

    const durationMinutes = Math.round((endMs - startMs) / (60 * 1000));
    const durationHours = durationMinutes / 60;
    const rateNumber = parseFloat(hourlyRate);

    if (isNaN(rateNumber) || rateNumber <= 0) {
        throw new Error('Hourly rate must be a positive number');
    }

    const totalAmountNumber = durationHours * rateNumber;

    return {
        durationMinutes,
        durationHours,
        priceAmount: rateNumber.toFixed(2),
        totalAmount: totalAmountNumber.toFixed(2),
        currency: 'INR',
    };
}
