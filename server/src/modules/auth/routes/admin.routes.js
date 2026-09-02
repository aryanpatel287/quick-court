import { Router } from 'express';
import multer from 'multer';
import * as adminFacilityController from '../controllers/admin-facility.controller.js';
import * as adminUserController from '../controllers/admin-user.controller.js';
import * as adminDashboardController from '../controllers/admin-dashboard.controller.js';
import * as adminController from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import {
    facilityListValidator,
    facilityIdValidator,
    facilityApproveValidator,
    facilityRejectValidator,
    userListValidator,
    userIdValidator,
    dashboardQueryValidator,
} from '../validators/admin.validator.js';
import {
    adminUpdateRoleValidator,
    updateProfileValidator,
    deleteAccountValidator,
} from '../validators/user.validator.js';
import { changePasswordValidator } from '../validators/auth.validator.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Protect all admin routes with authentication and admin role check
router.use(protect);
router.use(restrictTo('admin', 'ADMIN'));

// ==========================================
// 1. Admin Facility Management Routes
// ==========================================
router.get('/facilities', facilityListValidator, adminFacilityController.listFacilities);
router.get(
    '/facilities/pending',
    facilityListValidator,
    adminFacilityController.listPendingFacilities,
);
router.get(
    '/facilities/:facilityId',
    facilityIdValidator,
    adminFacilityController.getFacilityDetails,
);
router.patch(
    '/facilities/:facilityId/approve',
    facilityApproveValidator,
    adminFacilityController.approveFacility,
);
router.patch(
    '/facilities/:facilityId/reject',
    facilityRejectValidator,
    adminFacilityController.rejectFacility,
);

// ==========================================
// 2. Admin User Management Routes
// ==========================================
router.get('/users', userListValidator, adminUserController.listUsers);
router.post('/users/cleanup', adminUserController.adminCleanupUsers);
router.get('/users/:userId', userIdValidator, adminUserController.getUserDetails);
router.get('/users/:userId/bookings', userIdValidator, adminUserController.getUserBookings);
router.patch('/users/:userId/ban', userIdValidator, adminUserController.banUser);
router.patch('/users/:userId/unban', userIdValidator, adminUserController.unbanUser);
router.patch('/users/:id/role', adminUpdateRoleValidator, adminUserController.adminUpdateRole);
router.delete('/users/:id', adminUserController.adminDeleteUser);

// ==========================================
// 3. Admin Dashboard & Analytics Routes
// ==========================================
router.get('/dashboard/summary', adminDashboardController.getDashboardSummary);
router.get(
    '/dashboard/bookings',
    dashboardQueryValidator,
    adminDashboardController.getBookingTrends,
);
router.get(
    '/dashboard/users',
    dashboardQueryValidator,
    adminDashboardController.getUserGrowthTrends,
);
router.get(
    '/dashboard/facilities',
    dashboardQueryValidator,
    adminDashboardController.getFacilityApprovalTrends,
);
router.get('/dashboard/sports', adminDashboardController.getSportsDistribution);
router.get('/dashboard/earnings', adminDashboardController.getPlatformEarningsSummary);

// ==========================================
// 4. Admin Profile / Personal Routes
// ==========================================
router.get('/me', adminController.getMe);
router.get('/get-me', adminController.getMe);
router.patch('/profile', updateProfileValidator, adminController.updateProfile);
router.patch('/profile/avatar', upload.single('avatar'), adminController.uploadAvatar);
router.patch('/change-password', changePasswordValidator, adminController.changePassword);
router.delete('/me', deleteAccountValidator, adminController.deleteAccount);

export default router;
