import {
    getHomeFeed as getHomeFeedDao,
    getPopularVenues as getPopularVenuesDao,
    getPopularSports as getPopularSportsDao,
} from '../../../dao/venue.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Get aggregated home feed (popular venues, popular sports, platform stats)
 * GET /api/home
 */
export async function getHomeFeed(req, res, next) {
    try {
        const { city } = req.query;
        const feed = await getHomeFeedDao({ city });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Home feed retrieved successfully',
            success: true,
            data: feed,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get popular venues
 * GET /api/home/popular-venues
 */
export async function getPopularVenues(req, res, next) {
    try {
        const { limit, city } = req.query;
        const venues = await getPopularVenuesDao({
            limit: limit ? parseInt(limit, 10) : 6,
            city,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Popular venues retrieved successfully',
            success: true,
            venues,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get popular sports
 * GET /api/home/popular-sports
 */
export async function getPopularSports(req, res, next) {
    try {
        const { limit } = req.query;
        const sports = await getPopularSportsDao({
            limit: limit ? parseInt(limit, 10) : 10,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Popular sports retrieved successfully',
            success: true,
            sports,
        });
    } catch (error) {
        next(error);
    }
}
