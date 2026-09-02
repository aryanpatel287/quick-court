import {
    listVenues as listVenuesDao,
    getVenueById as getVenueByIdDao,
    getVenueCourts as getVenueCourtsDao,
    getCourtAvailability as getCourtAvailabilityDao,
} from '../../../dao/venue.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';
import { parseDDMMYYYY } from '../../../utils/date.utils.js';

/**
 * List approved venues with filtering, search, and pagination
 * GET /api/venues
 */
export async function listVenues(req, res, next) {
    try {
        const {
            search,
            city,
            sport,
            venueType,
            minPrice,
            maxPrice,
            minRating,
            page,
            limit,
            sortBy,
        } = req.query;

        const result = await listVenuesDao({
            search,
            city,
            sport,
            venueType,
            minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
            minRating: minRating !== undefined ? parseFloat(minRating) : undefined,
            page,
            limit,
            sortBy,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Venues retrieved successfully',
            success: true,
            venues: result.venues,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get venue details by venueId
 * GET /api/venues/:venueId
 */
export async function getVenueById(req, res, next) {
    try {
        const { venueId } = req.params;
        const venue = await getVenueByIdDao(venueId);

        if (!venue) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Venue not found',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Venue details retrieved successfully',
            success: true,
            venue,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get active courts for a venue
 * GET /api/venues/:venueId/courts
 */
export async function getVenueCourts(req, res, next) {
    try {
        const { venueId } = req.params;
        const courts = await getVenueCourtsDao(venueId);

        if (!courts) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Venue not found',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Venue courts retrieved successfully',
            success: true,
            courts,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get availability slots for a venue/court on a specific date
 * GET /api/venues/:venueId/availability
 */
export async function getVenueAvailability(req, res, next) {
    try {
        const { venueId } = req.params;
        const { date, courtId, slotDuration } = req.query;

        const targetDate = parseDDMMYYYY(date);
        if (!targetDate) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Invalid date format. Use DD-MM-YYYY or DDMMYYYY.',
                success: false,
            });
        }

        let targetCourtId = courtId;

        // If courtId was not provided, pick the first active court for the venue
        if (!targetCourtId) {
            const courts = await getVenueCourtsDao(venueId);
            if (!courts) {
                return sendResponse({
                    res,
                    statusCode: 404,
                    message: 'Venue not found',
                    success: false,
                });
            }
            if (courts.length === 0) {
                return sendResponse({
                    res,
                    statusCode: 200,
                    message: 'No active courts found for this venue',
                    success: true,
                    venueId,
                    courts: [],
                    slots: [],
                });
            }
            targetCourtId = courts[0].id;
        }

        const durationMinutes = slotDuration ? parseInt(slotDuration, 10) : 60;
        const availability = await getCourtAvailabilityDao(
            venueId,
            targetCourtId,
            targetDate,
            durationMinutes,
        );

        if (!availability) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Venue or court not found',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Court availability retrieved successfully',
            success: true,
            ...availability,
        });
    } catch (error) {
        next(error);
    }
}
