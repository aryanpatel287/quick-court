import { Router } from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth.controller.js';
import { protect, rateLimiter } from '../middleware/auth.middleware.js';
import envConfig from '../../../config/env.config.js';
import {
    registerValidator,
    registerUserValidator,
    registerFacilityOwnerValidator,
    verifyOtpValidator,
    resendOtpValidator,
    loginValidator,
    changePasswordValidator,
    forgotPasswordValidator,
    sendVerificationOtpValidator,
    resetPasswordValidator,
    recoverAccountValidator,
    verifyRecoverAccountValidator,
    verifyForgotPasswordOtpValidator,
} from '../validators/auth.validator.js';

const router = Router();

const authRateLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 3 }); //rate limiting

// Public Routes
router.post('/register/user', authRateLimiter, registerUserValidator, authController.registerUser);
router.post(
    '/register/facility-owner',
    authRateLimiter,
    registerFacilityOwnerValidator,
    authController.registerFacilityOwner,
);
router.post('/verify-otp', verifyOtpValidator, authController.verifyOtp);
router.post('/resend-otp', resendOtpValidator, authController.resendOtpHandler);

// Public Routes - Standard / Legacy
router.post('/register', authRateLimiter, registerValidator, authController.register);
router.post(
    '/send-verification-otp',
    authRateLimiter,
    sendVerificationOtpValidator,
    authController.sendVerificationOtp,
);
router.post('/login', authRateLimiter, loginValidator, authController.login);
router.post(
    '/forgot-password',
    authRateLimiter,
    forgotPasswordValidator,
    authController.forgotPassword,
);
router.post('/reset-password', resetPasswordValidator, authController.resetPassword);
router.post(
    '/verify-forgot-password-otp',
    verifyForgotPasswordOtpValidator,
    authController.verifyForgotPasswordOtp,
);
router.post('/verify-email', authController.verifyEmail);
router.post('/logout', authController.logout);
router.post(
    '/recover-account/request',
    authRateLimiter,
    recoverAccountValidator,
    authController.requestAccountRecovery,
);
router.post(
    '/recover-account/verify',
    verifyRecoverAccountValidator,
    authController.verifyAccountRecovery,
);
// Google OAuth routes
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
    }),
);

router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${envConfig.CLIENT_ORIGIN}/login?error=Google auth failed`,
    }),
    authController.googleCallback,
);

// Authenticated Routes
router.use(protect);

router.get('/me', authController.getMe);
router.get('/get-me', authController.getMe);
router.patch('/change-password', changePasswordValidator, authController.changePassword);

export default router;
