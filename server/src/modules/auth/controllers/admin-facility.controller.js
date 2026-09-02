import * as adminDao from '../../../dao/admin.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * List facilities with status filtering, search and pagination
 */
export async function listFacilities(req, res, next) {
    try {
        const { status, page = 1, limit = 20, search = '' } = req.query;
        const result = await adminDao.getFacilitiesByStatus({
            status,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            search,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Facilities retrieved successfully',
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List pending facilities awaiting approval
 */
export async function listPendingFacilities(req, res, next) {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const result = await adminDao.getFacilitiesByStatus({
            status: 'PENDING',
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            search,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Pending facilities retrieved successfully',
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get detailed facility information by ID
 */
export async function getFacilityDetails(req, res, next) {
    try {
        const facilityId = req.params.facilityId || req.params.id;
        const facility = await adminDao.getFacilityDetailsById(facilityId);

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Facility details retrieved successfully',
            success: true,
            data: { facility },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Approve a pending facility inside a database transaction
 */
export async function approveFacility(req, res, next) {
    try {
        const facilityId = req.params.facilityId || req.params.id;
        const { comment } = req.body;
        const adminId = req.user.id;

        const result = await adminDao.updateFacilityStatusWithHistory({
            facilityId,
            adminId,
            oldStatus: 'PENDING',
            newStatus: 'APPROVED',
            comment: comment || 'Facility approved by administrator',
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Facility approved successfully',
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Reject a pending facility inside a database transaction
 */
export async function rejectFacility(req, res, next) {
    try {
        const facilityId = req.params.facilityId || req.params.id;
        const { reason } = req.body;
        const adminId = req.user.id;

        const result = await adminDao.updateFacilityStatusWithHistory({
            facilityId,
            adminId,
            oldStatus: 'PENDING',
            newStatus: 'REJECTED',
            rejectionReason: reason,
            comment: reason,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Facility rejected successfully',
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}
