import * as adminDao from '../../../dao/admin.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Get dashboard overview summary metrics
 */
export async function getDashboardSummary(req, res, next) {
    try {
        const summary = await adminDao.getAdminDashboardSummary();
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Dashboard summary retrieved successfully',
            success: true,
            data: summary,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get booking analytics trends
 */
export async function getBookingTrends(req, res, next) {
    try {
        const { period = 'daily', startDate, endDate } = req.query;
        const trends = await adminDao.getBookingTrends({ period, startDate, endDate });
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Booking trends retrieved successfully',
            success: true,
            data: { trends },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get user growth & registration trends
 */
export async function getUserGrowthTrends(req, res, next) {
    try {
        const { period = 'daily', startDate, endDate } = req.query;
        const trends = await adminDao.getUserGrowthTrends({ period, startDate, endDate });
        return sendResponse({
            res,
            statusCode: 200,
            message: 'User growth trends retrieved successfully',
            success: true,
            data: { trends },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get facility approval & rejection trends
 */
export async function getFacilityApprovalTrends(req, res, next) {
    try {
        const { period = 'daily', startDate, endDate } = req.query;
        const trends = await adminDao.getFacilityApprovalTrends({ period, startDate, endDate });
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Facility approval trends retrieved successfully',
            success: true,
            data: { trends },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get sports popularity & distribution
 */
export async function getSportsDistribution(req, res, next) {
    try {
        const distribution = await adminDao.getSportsDistribution();
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Sports distribution retrieved successfully',
            success: true,
            data: { sports: distribution },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get platform earnings & payment metrics
 */
export async function getPlatformEarningsSummary(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const earnings = await adminDao.getPlatformEarningsSummary({ startDate, endDate });
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Platform earnings summary retrieved successfully',
            success: true,
            data: earnings,
        });
    } catch (error) {
        next(error);
    }
}
