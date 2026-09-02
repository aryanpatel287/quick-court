import { Router } from 'express';
import { generateQrCodePost, generateQrCodeGet } from '../controllers/qr.controller.js';

const qrRouter = Router();

/**
 * @route   POST /api/qr/generate
 * @desc    Generate QR code from JSON payload (supports dataURL, buffer, svg, terminal)
 * @access  Public
 */
qrRouter.post('/generate', generateQrCodePost);

/**
 * @route   GET /api/qr/generate
 * @desc    Generate and stream QR code image (PNG/SVG) on the fly via query parameters
 * @access  Public
 */
qrRouter.get('/generate', generateQrCodeGet);

export default qrRouter;
