import { Router } from 'express';
import { protect, restrictTo } from '../../auth/middleware/auth.middleware.js';
import * as availabilityController from '../controllers/availability.controller.js';
import * as availabilityValidators from '../validators/availability.validator.js';

const router = Router();

// All availability & maintenance routes require FACILITY_OWNER role
router.use(protect, restrictTo('FACILITY_OWNER'));

// Operating hours / availability
router.get(
    '/courts/:courtId/availability',
    availabilityValidators.courtIdParamValidator,
    availabilityController.getCourtAvailability,
);
router.post(
    '/courts/:courtId/availability',
    availabilityValidators.setAvailabilityValidator,
    availabilityController.setCourtAvailability,
);
router.patch(
    '/courts/:courtId/availability/:dayOfWeek',
    availabilityValidators.updateDayAvailabilityValidator,
    availabilityController.updateAvailabilityDay,
);

// Maintenance blocks
router.post(
    '/courts/:courtId/maintenance-blocks',
    availabilityValidators.createMaintenanceBlockValidator,
    availabilityController.createMaintenanceBlock,
);
router.get(
    '/courts/:courtId/maintenance-blocks',
    availabilityValidators.courtIdParamValidator,
    availabilityController.getMaintenanceBlocks,
);
router.delete(
    '/maintenance-blocks/:blockId',
    availabilityValidators.blockIdParamValidator,
    availabilityController.deleteMaintenanceBlock,
);

export default router;
