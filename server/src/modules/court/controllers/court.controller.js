import * as courtDao from '../../../dao/court.dao.js';
import * as facilityDao from '../../../dao/facility.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Add a new court to a facility
 * POST /api/owner/facilities/:facilityId/courts
 */
export async function createCourt(req, res, next) {
    try {
        const { facilityId } = req.params;
        const ownerId = req.user.id;
        const { name, sportId, priceAmount, priceCurrency = 'INR', operatingHours } = req.body;

        // Verify facility ownership
        const isOwner = await facilityDao.isFacilityOwner(facilityId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this facility.',
            });
        }

        // Verify sport is configured for this facility
        const isSportSupported = await courtDao.isSportSupportedByFacility(facilityId, sportId);
        if (!isSportSupported) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message:
                    'The selected sport is not supported by this facility. Please add the sport to the facility first.',
            });
        }

        // Check for duplicate court name within the facility
        const isNameTaken = await courtDao.isCourtNameTakenInFacility(facilityId, name);
        if (isNameTaken) {
            return sendResponse({
                res,
                statusCode: 409,
                success: false,
                message: `A court named "${name}" already exists in this facility.`,
            });
        }

        const newCourt = await courtDao.createCourt(
            {
                facilityId,
                sportId,
                name: name.trim(),
                priceAmount: String(priceAmount),
                priceCurrency,
                isActive: true,
            },
            operatingHours,
        );

        return sendResponse({
            res,
            statusCode: 201,
            success: true,
            message: 'Court created successfully with default operating hours.',
            court: newCourt,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List all courts in a specific facility
 * GET /api/owner/facilities/:facilityId/courts
 */
export async function getCourtsByFacility(req, res, next) {
    try {
        const { facilityId } = req.params;
        const ownerId = req.user.id;
        const { isActive, sportId } = req.query;

        // Verify facility ownership
        const isOwner = await facilityDao.isFacilityOwner(facilityId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this facility.',
            });
        }

        const courts = await courtDao.getCourtsByFacilityId(facilityId, {
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            sportId,
        });

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Courts retrieved successfully.',
            courts,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get single court details with operating hours and upcoming maintenance
 * GET /api/owner/courts/:courtId
 */
export async function getCourtById(req, res, next) {
    try {
        const { courtId } = req.params;
        const ownerId = req.user.id;

        const court = await courtDao.getCourtByIdWithRelations(courtId);
        if (!court) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Court not found.',
            });
        }

        if (court.facilityOwnerId !== ownerId) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own the facility this court belongs to.',
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Court details retrieved successfully.',
            court,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update court properties
 * PATCH /api/owner/courts/:courtId
 */
export async function updateCourt(req, res, next) {
    try {
        const { courtId } = req.params;
        const ownerId = req.user.id;

        const isOwner = await courtDao.isCourtOwner(courtId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this court.',
            });
        }

        const existingCourt = await courtDao.getCourtByIdWithRelations(courtId);
        if (!existingCourt) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Court not found.',
            });
        }

        const { name, sportId, priceAmount, isActive } = req.body;
        const updates = {};

        if (name !== undefined) {
            const isNameTaken = await courtDao.isCourtNameTakenInFacility(
                existingCourt.facilityId,
                name,
                courtId,
            );
            if (isNameTaken) {
                return sendResponse({
                    res,
                    statusCode: 409,
                    success: false,
                    message: `Another court named "${name}" already exists in this facility.`,
                });
            }
            updates.name = name.trim();
        }

        if (sportId !== undefined) {
            const isSportSupported = await courtDao.isSportSupportedByFacility(
                existingCourt.facilityId,
                sportId,
            );
            if (!isSportSupported) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'The selected sport is not supported by this facility.',
                });
            }
            updates.sportId = sportId;
        }

        if (priceAmount !== undefined) {
            updates.priceAmount = String(priceAmount);
        }

        if (isActive !== undefined) {
            updates.isActive = Boolean(isActive);
        }

        const updatedCourt = await courtDao.updateCourt(courtId, updates);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Court updated successfully.',
            court: updatedCourt,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a court (guarded against active future bookings)
 * DELETE /api/owner/courts/:courtId
 */
export async function deleteCourt(req, res, next) {
    try {
        const { courtId } = req.params;
        const ownerId = req.user.id;

        const isOwner = await courtDao.isCourtOwner(courtId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this court.',
            });
        }

        // Critical Guard: Check if future bookings exist
        const hasBookings = await courtDao.hasFutureBookings(courtId);
        if (hasBookings) {
            // Automatically deactivate court to protect existing reservations
            await courtDao.deactivateCourt(courtId);

            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message:
                    'Cannot delete court with upcoming bookings. The court has been automatically deactivated (isActive = false) to prevent new reservations while honoring existing ones.',
            });
        }

        // If no future bookings, safe to delete
        await courtDao.deleteCourt(courtId);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Court deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
}
