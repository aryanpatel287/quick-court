import * as availabilityDao from '../../../dao/availability.dao.js';
import * as maintenanceDao from '../../../dao/maintenance.dao.js';
import * as courtDao from '../../../dao/court.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Get configured 7-day operating hours for a court
 * GET /api/owner/courts/:courtId/availability
 */
export async function getCourtAvailability(req, res, next) {
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

        const schedules = await availabilityDao.getOperatingHours(courtId);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Court operating hours retrieved successfully.',
            schedules,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Batch configure/upsert 7-day operating hours for a court
 * POST /api/owner/courts/:courtId/availability
 */
export async function setCourtAvailability(req, res, next) {
    try {
        const { courtId } = req.params;
        const ownerId = req.user.id;
        const { schedules } = req.body;

        const isOwner = await courtDao.isCourtOwner(courtId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this court.',
            });
        }

        const updatedSchedules = await availabilityDao.upsertWeeklyOperatingHours(
            courtId,
            schedules,
        );

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Weekly operating hours updated successfully.',
            schedules: updatedSchedules,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update single day's operating hours or toggle closed
 * PATCH /api/owner/courts/:courtId/availability/:dayOfWeek
 */
export async function updateAvailabilityDay(req, res, next) {
    try {
        const { courtId, dayOfWeek } = req.params;
        const ownerId = req.user.id;
        const { startTime, endTime, isClosed } = req.body;

        const isOwner = await courtDao.isCourtOwner(courtId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this court.',
            });
        }

        const updated = await availabilityDao.updateDayOperatingHours(
            courtId,
            parseInt(dayOfWeek, 10),
            { startTime, endTime, isClosed },
        );

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: `Operating hours for day ${dayOfWeek} updated successfully.`,
            schedule: updated,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Schedule a maintenance block on a court
 * POST /api/owner/courts/:courtId/maintenance-blocks
 */
export async function createMaintenanceBlock(req, res, next) {
    try {
        const { courtId } = req.params;
        const ownerId = req.user.id;
        const { startTime, endTime, reason } = req.body;

        const isOwner = await courtDao.isCourtOwner(courtId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this court.',
            });
        }

        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        // 1. Verify that maintenance window falls within operating hours
        const hoursCheck = await availabilityDao.checkWithinOperatingHours(
            courtId,
            startDate,
            endDate,
        );
        if (!hoursCheck.isWithin) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: `Invalid maintenance time: ${hoursCheck.reason}`,
            });
        }

        // 2. CRITICAL COLLISION DETECTION: Check against confirmed user bookings
        const conflictingBookings = await maintenanceDao.findConflictingBookings(
            courtId,
            startDate,
            endDate,
        );
        if (conflictingBookings.length > 0) {
            return sendResponse({
                res,
                statusCode: 409,
                success: false,
                message:
                    'Cannot schedule maintenance: Confirmed user bookings exist during this time window.',
                conflicts: conflictingBookings,
            });
        }

        // 3. Check collision with existing maintenance blocks
        const conflictingBlocks = await maintenanceDao.findConflictingMaintenanceBlocks(
            courtId,
            startDate,
            endDate,
        );
        if (conflictingBlocks.length > 0) {
            return sendResponse({
                res,
                statusCode: 409,
                success: false,
                message:
                    'Cannot schedule maintenance: Overlaps with an already scheduled maintenance block.',
                conflicts: conflictingBlocks,
            });
        }

        const newBlock = await maintenanceDao.createMaintenanceBlock({
            courtId,
            createdBy: ownerId,
            startTime: startDate,
            endTime: endDate,
            reason,
        });

        return sendResponse({
            res,
            statusCode: 201,
            success: true,
            message: 'Maintenance block scheduled successfully.',
            maintenanceBlock: newBlock,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List maintenance blocks for a court
 * GET /api/owner/courts/:courtId/maintenance-blocks
 */
export async function getMaintenanceBlocks(req, res, next) {
    try {
        const { courtId } = req.params;
        const ownerId = req.user.id;
        const { upcoming, startDate, endDate } = req.query;

        const isOwner = await courtDao.isCourtOwner(courtId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this court.',
            });
        }

        const blocks = await maintenanceDao.getMaintenanceBlocksByCourt(courtId, {
            upcoming: upcoming !== undefined ? upcoming === 'true' : true,
            startDate,
            endDate,
        });

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Maintenance blocks retrieved successfully.',
            maintenanceBlocks: blocks,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Remove a maintenance block
 * DELETE /api/owner/maintenance-blocks/:blockId
 */
export async function deleteMaintenanceBlock(req, res, next) {
    try {
        const { blockId } = req.params;
        const ownerId = req.user.id;

        const isOwner = await maintenanceDao.isMaintenanceBlockOwner(blockId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message:
                    'Access denied. You do not own the facility this maintenance block belongs to.',
            });
        }

        const deleted = await maintenanceDao.deleteMaintenanceBlock(blockId);
        if (!deleted) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Maintenance block not found.',
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Maintenance block removed successfully. The time slot is now available.',
        });
    } catch (error) {
        next(error);
    }
}
