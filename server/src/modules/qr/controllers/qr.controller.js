import {
    generateBuffer,
    generateSVG,
    generateQRCode,
} from '../../../services/qr/index.qr.service.js';
import { sendQrResponse, sendResponse } from '../../../utils/response.utlis.js';

/**
 * POST /api/qr/generate
 * Generates QR code based on JSON payload
 */
export async function generateQrCodePost(req, res, next) {
    try {
        const { text, format = 'dataURL', options = {} } = req.body || {};

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'text is required and cannot be empty in request body',
            });
        }

        const normalizedFormat = format.toLowerCase();

        if (normalizedFormat === 'buffer' || normalizedFormat === 'png') {
            const buffer = await generateBuffer(text, options);
            const filename = options.filename || 'qrcode.png';
            return sendQrResponse({
                res,
                qrData: buffer,
                format: 'png',
                filename,
                isInline: options.download !== true,
            });
        }

        const result = await generateQRCode({
            text,
            format: normalizedFormat,
            options,
        });

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'QR code generated successfully',
            data: {
                qr: result,
                format: normalizedFormat,
            },
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * GET /api/qr/generate
 * Generates and streams QR code on the fly via query parameters
 */
export async function generateQrCodeGet(req, res, next) {
    try {
        const {
            text,
            format = 'png',
            width,
            margin,
            scale,
            colorDark,
            colorLight,
            ecLevel,
            download,
            filename = 'qrcode.png',
        } = req.query;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter "text" is required',
            });
        }

        const options = {};
        if (width) options.width = Number(width);
        if (margin !== undefined) options.margin = Number(margin);
        if (scale) options.scale = Number(scale);
        if (ecLevel) options.errorCorrectionLevel = ecLevel;

        if (colorDark || colorLight) {
            options.color = {};
            if (colorDark) {
                options.color.dark = colorDark.startsWith('#') ? colorDark : `#${colorDark}`;
            }
            if (colorLight) {
                options.color.light = colorLight.startsWith('#') ? colorLight : `#${colorLight}`;
            }
        }

        const normalizedFormat = format.toLowerCase();
        const isSvg = normalizedFormat === 'svg';
        const isInline = download !== 'true';

        if (isSvg) {
            const svgString = await generateSVG(text, options);
            return sendQrResponse({
                res,
                qrData: svgString,
                format: 'svg',
                filename: filename.endsWith('.svg') ? filename : `${filename}.svg`,
                isInline,
            });
        }

        const buffer = await generateBuffer(text, options);
        return sendQrResponse({
            res,
            qrData: buffer,
            format: 'png',
            filename: filename.endsWith('.png') ? filename : `${filename}.png`,
            isInline,
        });
    } catch (error) {
        return next(error);
    }
}
