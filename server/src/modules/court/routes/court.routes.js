import { Router } from 'express';
import { protect, restrictTo } from '../../auth/middleware/auth.middleware.js';
import * as courtController from '../controllers/court.controller.js';
import * as courtValidators from '../validators/court.validator.js';

const router = Router();

// All court management routes require FACILITY_OWNER role
router.use(protect, restrictTo('FACILITY_OWNER'));

// Facility-scoped courts
router.post(
    '/facilities/:facilityId/courts',
    courtValidators.createCourtValidator,
    courtController.createCourt,
);
router.get(
    '/facilities/:facilityId/courts',
    courtValidators.facilityCourtsParamValidator,
    courtController.getCourtsByFacility,
);

// Individual court actions
router.get('/courts/:courtId', courtValidators.courtIdParamValidator, courtController.getCourtById);
router.patch('/courts/:courtId', courtValidators.updateCourtValidator, courtController.updateCourt);
router.delete(
    '/courts/:courtId',
    courtValidators.courtIdParamValidator,
    courtController.deleteCourt,
);

export default router;
