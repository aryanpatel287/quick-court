import { Router } from 'express';
import multer from 'multer';
import { protect, restrictTo } from '../../auth/middleware/auth.middleware.js';
import * as facilityController from '../controllers/facility.controller.js';
import * as facilityValidators from '../validators/facility.validator.js';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max per photo
        files: 10,
    },
});

// All routes under this router require authentication and FACILITY_OWNER role
router.use(protect, restrictTo('FACILITY_OWNER'));

// Facility CRUD
router.post('/', facilityValidators.createFacilityValidator, facilityController.createFacility);
router.get('/', facilityController.getMyFacilities);
router.get(
    '/:facilityId',
    facilityValidators.facilityIdParamValidator,
    facilityController.getFacilityById,
);
router.patch(
    '/:facilityId',
    facilityValidators.updateFacilityValidator,
    facilityController.updateFacility,
);
router.delete(
    '/:facilityId',
    facilityValidators.facilityIdParamValidator,
    facilityController.deleteFacility,
);

// Facility Photos
router.post(
    '/:facilityId/photos',
    upload.array('photos', 10),
    facilityValidators.facilityIdParamValidator,
    facilityController.uploadFacilityPhotos,
);
router.delete(
    '/:facilityId/photos/:photoId',
    facilityValidators.facilityPhotoParamValidator,
    facilityController.deleteFacilityPhoto,
);
router.patch(
    '/:facilityId/photos/:photoId/primary',
    facilityValidators.facilityPhotoParamValidator,
    facilityController.setPrimaryPhoto,
);

export default router;
