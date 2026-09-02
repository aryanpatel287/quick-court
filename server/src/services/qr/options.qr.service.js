import { QRValidationError } from './errors.qr.service.js';

/**
 * Valid error correction levels for QR Code generation
 */
export const VALID_ERROR_CORRECTION_LEVELS = new Set([
    'L',
    'M',
    'Q',
    'H',
    'low',
    'medium',
    'quartile',
    'high',
]);

/**
 * Default options applied to all QR Code renderings in Apex
 */
export const defaultQROptions = {
    errorCorrectionLevel: 'M',
    margin: 4,
    scale: 4,
    color: {
        dark: '#000000ff',
        light: '#ffffffff',
    },
};

/**
 * Hex color validation pattern (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
 */
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

/**
 * Validates and merges user options with Apex default QR options
 *
 * @param {object} [userOptions={}]
 * @returns {object} Merged and validated configuration for node-qrcode
 * @throws {QRValidationError} If options fail validation
 */
export function resolveQROptions(userOptions = {}) {
    if (userOptions !== null && typeof userOptions !== 'object') {
        throw new QRValidationError('QR options must be an object');
    }

    const options = { ...userOptions };

    // Validate and normalize errorCorrectionLevel if provided
    if (options.errorCorrectionLevel !== undefined) {
        if (
            typeof options.errorCorrectionLevel !== 'string' ||
            !VALID_ERROR_CORRECTION_LEVELS.has(options.errorCorrectionLevel)
        ) {
            throw new QRValidationError(
                `Invalid errorCorrectionLevel '${options.errorCorrectionLevel}'. Must be one of: 'L', 'M', 'Q', 'H' (or 'low', 'medium', 'quartile', 'high').`,
            );
        }
    }

    // Validate margin if provided
    if (options.margin !== undefined) {
        if (
            typeof options.margin !== 'number' ||
            options.margin < 0 ||
            !Number.isFinite(options.margin)
        ) {
            throw new QRValidationError('Margin must be a non-negative finite number');
        }
    }

    // Validate scale if provided
    if (options.scale !== undefined) {
        if (
            typeof options.scale !== 'number' ||
            options.scale <= 0 ||
            !Number.isFinite(options.scale)
        ) {
            throw new QRValidationError('Scale must be a positive finite number');
        }
    }

    // Validate width if provided
    if (options.width !== undefined) {
        if (
            typeof options.width !== 'number' ||
            options.width <= 0 ||
            !Number.isFinite(options.width)
        ) {
            throw new QRValidationError('Width must be a positive finite number (in pixels)');
        }
    }

    // Validate version if provided (1 - 40)
    if (options.version !== undefined) {
        if (
            typeof options.version !== 'number' ||
            !Number.isInteger(options.version) ||
            options.version < 1 ||
            options.version > 40
        ) {
            throw new QRValidationError('Version must be an integer between 1 and 40');
        }
    }

    // Validate maskPattern if provided (0 - 7)
    if (options.maskPattern !== undefined) {
        if (
            typeof options.maskPattern !== 'number' ||
            !Number.isInteger(options.maskPattern) ||
            options.maskPattern < 0 ||
            options.maskPattern > 7
        ) {
            throw new QRValidationError('maskPattern must be an integer between 0 and 7');
        }
    }

    // Merge color preferences
    const color = {
        ...defaultQROptions.color,
        ...(options.color || {}),
    };

    if (options.color?.dark !== undefined) {
        if (typeof options.color.dark !== 'string' || !HEX_COLOR_REGEX.test(options.color.dark)) {
            throw new QRValidationError(
                `Invalid color.dark value '${options.color.dark}'. Must be a valid hex color (e.g. #000000 or #000000ff)`,
            );
        }
    }

    if (options.color?.light !== undefined) {
        if (typeof options.color.light !== 'string' || !HEX_COLOR_REGEX.test(options.color.light)) {
            throw new QRValidationError(
                `Invalid color.light value '${options.color.light}'. Must be a valid hex color (e.g. #ffffff or #ffffffff)`,
            );
        }
    }

    const merged = {
        ...defaultQROptions,
        ...options,
        color,
    };

    return merged;
}
