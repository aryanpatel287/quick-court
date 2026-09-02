/**
 * Base PDF error class for Apex PDF operations
 */
export class PDFError extends Error {
    /**
     * @param {string} message
     * @param {object} [options]
     * @param {Error} [options.cause]
     * @param {number} [options.statusCode=500]
     * @param {string} [options.code='PDF_ERROR']
     */
    constructor(message, options = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = options.statusCode || 500;
        this.code = options.code || 'PDF_ERROR';

        if (options.cause) {
            this.cause = options.cause;
        }

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Thrown when PDF input parameters, HTML, or options fail validation
 */
export class PDFValidationError extends PDFError {
    /**
     * @param {string} message
     * @param {object} [options]
     */
    constructor(message, options = {}) {
        super(message, {
            ...options,
            statusCode: 400,
            code: 'PDF_VALIDATION_ERROR',
        });
    }
}

/**
 * Thrown when underlying PDF generation/rendering fails
 */
export class PDFGenerationError extends PDFError {
    /**
     * @param {string} message
     * @param {object} [options]
     */
    constructor(message, options = {}) {
        super(message, {
            ...options,
            statusCode: 500,
            code: 'PDF_GENERATION_ERROR',
        });
    }
}
