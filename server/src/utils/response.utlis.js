import jwt from 'jsonwebtoken';
import envConfig from '../config/env.config.js';

/**
 * Centralised response structure
 */
export async function sendResponse({
    res,
    statusCode,
    message,
    success,
    error = null,
    ...additionalData
}) {
    return res.status(statusCode).json({
        message,
        success,
        error,
        ...additionalData,
    });
}

/**
 * Set the JWT token cookie on response
 */
export function setTokenCookie(res, token, rememberMe = false) {
    const cookieOptions = {
        ...envConfig.AUTH_COOKIE_OPTIONS,
        maxAge: rememberMe ? 15 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 15 days vs 1 day
    };
    res.cookie('token', token, cookieOptions);
}

/**
 * Sign user token, set cookie, and send user response
 */
export async function sendTokenResponse(res, statusCode, message, user, rememberMe = false) {
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        envConfig.JWT_SECRET,
        { expiresIn: rememberMe ? '15d' : '1d' },
    );

    setTokenCookie(res, token, rememberMe);

    return sendResponse({
        res,
        statusCode,
        message,
        success: true,
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    });
}

/**
 * Send PDF buffer response with standard headers
 *
 * @param {object} params
 * @param {import('express').Response} params.res - Express response object
 * @param {Buffer} params.pdfBuffer - Generated PDF Buffer
 * @param {string} [params.filename='document.pdf'] - Download filename
 * @param {boolean} [params.isInline=false] - Whether to view inline in browser or trigger download
 * @param {number} [params.statusCode=200] - HTTP status code
 */
export function sendPdfResponse({
    res,
    pdfBuffer,
    filename = 'document.pdf',
    isInline = false,
    statusCode = 200,
}) {
    const disposition = isInline ? 'inline' : 'attachment';

    res.status(statusCode).set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache',
    });

    return res.send(pdfBuffer);
}

/**
 * Send QR Code image or SVG response with appropriate headers
 *
 * @param {object} params
 * @param {import('express').Response} params.res - Express response object
 * @param {Buffer|string} params.qrData - Generated QR Buffer or SVG string
 * @param {'png'|'svg'} [params.format='png'] - Image format
 * @param {string} [params.filename='qrcode.png'] - Download filename
 * @param {boolean} [params.isInline=true] - Whether to view inline in browser or trigger download
 * @param {number} [params.statusCode=200] - HTTP status code
 */
export function sendQrResponse({
    res,
    qrData,
    format = 'png',
    filename = 'qrcode.png',
    isInline = true,
    statusCode = 200,
}) {
    const disposition = isInline ? 'inline' : 'attachment';
    const isSvg = format.toLowerCase() === 'svg';
    const contentType = isSvg ? 'image/svg+xml' : 'image/png';

    res.status(statusCode).set({
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400',
    });

    if (Buffer.isBuffer(qrData)) {
        res.set('Content-Length', qrData.length);
    }

    return res.send(qrData);
}
