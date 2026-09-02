/**
 * Base QR error class for Apex QR operations
 */
export class QRError extends Error {
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {Error} [options.cause]
     * @param {number} [options.statusCode=500]
     * @param {string} [options.code='QR_ERROR']
     */
    constructor(message, options = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = options.statusCode || 500;
        this.code = options.code || 'QR_ERROR';

        if (options.cause) {
            this.cause = options.cause;
        }

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Thrown when QR code input parameters, text, or options fail validation
 */
export class QRValidationError extends QRError {
    /**
     * @param {string} message
     * @param {object} [options]
     */
    constructor(message, options = {}) {
        super(message, {
            ...options,
            statusCode: 400,
            code: 'QR_VALIDATION_ERROR',
        });
    }
}

/**
 * Thrown when underlying QR code generation fails
 */
export class QRGenerationError extends QRError {
    /**
     * @param {string} message
     * @param {object} [options]
     */
    constructor(message, options = {}) {
        super(message, {
            ...options,
            statusCode: 500,
            code: 'QR_GENERATION_ERROR',
        });
    }
}
