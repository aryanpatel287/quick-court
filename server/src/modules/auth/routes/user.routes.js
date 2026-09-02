import { Router } from 'express';
import multer from 'multer';
import * as userController from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
import { updateProfileValidator, deleteAccountValidator } from '../validators/user.validator.js';
import { changePasswordValidator } from '../validators/auth.validator.js';

const router = Router();

// Protect all routes
router.use(protect);

// Personal User Routes
router.get('/get-me', userController.getMe);
router.patch('/profile', updateProfileValidator, userController.updateProfile);
router.patch('/profile/avatar', upload.single('avatar'), userController.uploadAvatar);
router.patch('/change-password', changePasswordValidator, userController.changePassword);
router.delete('/me', deleteAccountValidator, userController.deleteAccount);

export default router;
