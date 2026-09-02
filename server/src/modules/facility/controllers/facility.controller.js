import * as facilityDao from '../../../dao/facility.dao.js';
import * as courtDao from '../../../dao/court.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';
import { uploadMultipleImagesOnImageKit } from '../../../services/image.service.js';

/**
 * Register a new facility under the authenticated facility owner
 * POST /api/owner/facilities
 */
export async function createFacility(req, res, next) {
    try {
        const ownerId = req.user.id;
        const {
            name,
            description,
            addressLine,
            city,
            state,
            postalCode,
            latitude,
            longitude,
            venueType,
            sportIds = [],
            amenityIds = [],
        } = req.body;

        const facilityData = {
            ownerId,
            name,
            description: description || null,
            addressLine,
            city,
            state,
            postalCode: postalCode || null,
            latitude: latitude !== undefined ? String(latitude) : null,
            longitude: longitude !== undefined ? String(longitude) : null,
            venueType,
        };

        const newFacility = await facilityDao.createFacility({
            facilityData,
            sportIds,
            amenityIds,
        });

        const fullFacility = await facilityDao.getFacilityDetailsById(newFacility.id);

        return sendResponse({
            res,
            statusCode: 201,
            success: true,
            message: 'Facility registered successfully. It is now pending admin approval.',
            facility: fullFacility,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List all facilities owned by the current user
 * GET /api/owner/facilities
 */
export async function getMyFacilities(req, res, next) {
    try {
        const ownerId = req.user.id;
        const { status, search, page, limit } = req.query;

        const result = await facilityDao.getFacilitiesByOwner(ownerId, {
            status,
            search,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
        });

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Owner facilities retrieved successfully.',
            ...result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get detailed view of an owner's facility
 * GET /api/owner/facilities/:facilityId
 */
export async function getFacilityById(req, res, next) {
    try {
        const { facilityId } = req.params;
        const ownerId = req.user.id;

        const facility = await facilityDao.getFacilityDetailsById(facilityId);

        if (!facility) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Facility not found.',
            });
        }

        if (facility.ownerId !== ownerId) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this facility.',
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Facility details retrieved successfully.',
            facility,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update an existing facility
 * PATCH /api/owner/facilities/:facilityId
 */
export async function updateFacility(req, res, next) {
    try {
        const { facilityId } = req.params;
        const ownerId = req.user.id;

        const isOwner = await facilityDao.isFacilityOwner(facilityId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this facility.',
            });
        }

        const existingFacility = await facilityDao.getFacilityDetailsById(facilityId);
        if (!existingFacility) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Facility not found.',
            });
        }

        const {
            name,
            description,
            addressLine,
            city,
            state,
            postalCode,
            latitude,
            longitude,
            venueType,
            sportIds,
            amenityIds,
        } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (addressLine !== undefined) updates.addressLine = addressLine;
        if (city !== undefined) updates.city = city;
        if (state !== undefined) updates.state = state;
        if (postalCode !== undefined) updates.postalCode = postalCode;
        if (latitude !== undefined) updates.latitude = latitude !== null ? String(latitude) : null;
        if (longitude !== undefined)
            updates.longitude = longitude !== null ? String(longitude) : null;
        if (venueType !== undefined) updates.venueType = venueType;

        // If facility was previously REJECTED, reset to PENDING for admin re-evaluation
        if (existingFacility.status === 'REJECTED') {
            updates.status = 'PENDING';
            updates.rejectionReason = null;
        }

        await facilityDao.updateFacility(facilityId, updates, { sportIds, amenityIds });
        const updatedFacility = await facilityDao.getFacilityDetailsById(facilityId);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Facility updated successfully.',
            facility: updatedFacility,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Soft delete a facility (guarded against active future bookings)
 * DELETE /api/owner/facilities/:facilityId
 */
export async function deleteFacility(req, res, next) {
    try {
        const { facilityId } = req.params;
        const ownerId = req.user.id;

        const isOwner = await facilityDao.isFacilityOwner(facilityId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this facility.',
            });
        }

        // Check if any court under this facility has confirmed future bookings
        const hasFutureBookings = await courtDao.hasActiveOrFutureBookingsForFacility(facilityId);
        if (hasFutureBookings) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message:
                    'Cannot delete facility: There are active or upcoming confirmed bookings. Please cancel bookings or deactivate individual courts first.',
            });
        }

        await facilityDao.softDeleteFacility(facilityId);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Facility and its courts have been deactivated successfully.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Upload multiple photos for a facility using ImageKit
 * POST /api/owner/facilities/:facilityId/photos
 */
export async function uploadFacilityPhotos(req, res, next) {
    try {
        const { facilityId } = req.params;
        const ownerId = req.user.id;

        const isOwner = await facilityDao.isFacilityOwner(facilityId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this facility.',
            });
        }

        if (!req.files || req.files.length === 0) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Please provide at least one photo file to upload.',
            });
        }

        // Upload images to ImageKit
        const uploadResults = await uploadMultipleImagesOnImageKit(req.files);

        // Check if facility currently has any photos
        const currentPhotoCount = await facilityDao.getPhotosCount(facilityId);

        // Prepare records for database
        const photoRecords = uploadResults.map((result, index) => ({
            facilityId,
            imageUrl: result.url,
            imageKey: result.fileId || null,
            displayOrder: currentPhotoCount + index,
            // If facility currently has 0 photos, set the first uploaded one as primary
            isPrimary: currentPhotoCount === 0 && index === 0,
        }));

        const insertedPhotos = await facilityDao.addFacilityPhotos(photoRecords);

        return sendResponse({
            res,
            statusCode: 201,
            success: true,
            message: 'Photos uploaded successfully.',
            photos: insertedPhotos,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a photo from a facility
 * DELETE /api/owner/facilities/:facilityId/photos/:photoId
 */
export async function deleteFacilityPhoto(req, res, next) {
    try {
        const { facilityId, photoId } = req.params;
        const ownerId = req.user.id;

        const isOwner = await facilityDao.isFacilityOwner(facilityId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this facility.',
            });
        }

        const photo = await facilityDao.getPhotoById(photoId, facilityId);
        if (!photo) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Photo not found.',
            });
        }

        await facilityDao.deleteFacilityPhoto(photoId, facilityId);

        // If deleted photo was primary, promote the next photo in line
        if (photo.isPrimary) {
            await facilityDao.promoteNextPrimaryPhoto(facilityId);
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Photo deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Designate a photo as the primary cover photo for a facility
 * PATCH /api/owner/facilities/:facilityId/photos/:photoId/primary
 */
export async function setPrimaryPhoto(req, res, next) {
    try {
        const { facilityId, photoId } = req.params;
        const ownerId = req.user.id;

        const isOwner = await facilityDao.isFacilityOwner(facilityId, ownerId);
        if (!isOwner) {
            return sendResponse({
                res,
                statusCode: 403,
                success: false,
                message: 'Access denied. You do not own this facility.',
            });
        }

        const photo = await facilityDao.getPhotoById(photoId, facilityId);
        if (!photo) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Photo not found.',
            });
        }

        const updated = await facilityDao.setPrimaryPhoto(facilityId, photoId);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Primary photo updated successfully.',
            photo: updated,
        });
    } catch (error) {
        next(error);
    }
}
