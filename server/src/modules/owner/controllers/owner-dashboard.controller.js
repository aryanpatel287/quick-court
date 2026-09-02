import {
    getOwnerDashboardSummary as getOwnerDashboardSummaryDao,
    getOwnerBookingsTrend as getOwnerBookingsTrendDao,
    getOwnerEarnings as getOwnerEarningsDao,
    getOwnerPeakHours as getOwnerPeakHoursDao,
} from '../../../dao/analytics.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';
import { parseDDMMYYYY } from '../../../utils/date.utils.js';

/**
 * Get dashboard summary KPIs for facility owner
 * GET /api/owner/dashboard/summary
 */
export async function getDashboardSummary(req, res, next) {
    try {
        const { facilityId } = req.query;
        const summary = await getOwnerDashboardSummaryDao(req.user.id, facilityId);

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
 * Get booking & earnings trends
 * GET /api/owner/dashboard/bookings-trend
 */
export async function getBookingsTrend(req, res, next) {
    try {
        const { facilityId, period, startDate, endDate } = req.query;

        const trends = await getOwnerBookingsTrendDao({
            ownerId: req.user.id,
            facilityId,
            period: period || 'daily',
            startDate: startDate ? parseDDMMYYYY(startDate) : undefined,
            endDate: endDate ? parseDDMMYYYY(endDate) : undefined,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Bookings trend retrieved successfully',
            success: true,
            period: period || 'daily',
            trends,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get earnings breakdown by court, facility, and monthly timeline
 * GET /api/owner/dashboard/earnings
 */
export async function getEarnings(req, res, next) {
    try {
        const { facilityId } = req.query;
        const earnings = await getOwnerEarningsDao({
            ownerId: req.user.id,
            facilityId,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Earnings data retrieved successfully',
            success: true,
            data: earnings,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get peak booking hours distribution (0-23)
 * GET /api/owner/dashboard/peak-hours
 */
export async function getPeakHours(req, res, next) {
    try {
        const { facilityId } = req.query;
        const peakHours = await getOwnerPeakHoursDao({
            ownerId: req.user.id,
            facilityId,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Peak hours retrieved successfully',
            success: true,
            peakHours,
        });
    } catch (error) {
        next(error);
    }
}
