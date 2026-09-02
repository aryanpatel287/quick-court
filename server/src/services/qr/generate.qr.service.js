import QRCode from 'qrcode';
import { QRValidationError, QRGenerationError } from './errors.qr.service.js';
import { resolveQROptions } from './options.qr.service.js';

/**
 * Validates the input text or segments payload before generation
 *
 * @param {string|Array<object>} input - Text string, URL, or mixed-mode segment array
 * @throws {QRValidationError} If input is invalid or empty
 */
function validateQRInput(input) {
    if (input === undefined || input === null) {
        throw new QRValidationError('QR code input is required (received null or undefined)');
    }

    if (typeof input === 'string') {
        if (input.trim().length === 0) {
            throw new QRValidationError('QR code input text cannot be empty');
        }
        return;
    }

    if (Array.isArray(input)) {
        if (input.length === 0) {
            throw new QRValidationError('QR code segments array cannot be empty');
        }
        return;
    }

    if (Buffer.isBuffer(input) || ArrayBuffer.isView(input)) {
        return;
    }

    throw new QRValidationError(
        `QR code input must be a string, array of segments, or Buffer (received ${typeof input})`,
    );
}

/**
 * Generates a Base64 Data URL representation of a QR Code.
 *
 * @param {string|Array} textOrSegments - Text, URL, or segments array
 * @param {object} [options={}] - Custom QR options (margin, scale, width, color, errorCorrectionLevel)
 * @returns {Promise<string>} - Resolves to Data URL (e.g. 'data:image/png;base64,...')
 * @throws {QRValidationError} If input or options fail validation
 * @throws {QRGenerationError} If underlying QR generation fails
 */
export async function generateDataURL(textOrSegments, options = {}) {
    validateQRInput(textOrSegments);
    const resolvedOptions = resolveQROptions(options);

    try {
        const dataUrl = await QRCode.toDataURL(textOrSegments, resolvedOptions);
        return dataUrl;
    } catch (error) {
        if (error instanceof QRValidationError) throw error;
        throw new QRGenerationError(
            `Failed to generate QR Data URL: ${error.message || String(error)}`,
            {
                cause: error,
            },
        );
    }
}

/**
 * Generates a binary Node.js Buffer (PNG format) of a QR Code.
 *
 * @param {string|Array} textOrSegments - Text, URL, or segments array
 * @param {object} [options={}] - Custom QR options
 * @returns {Promise<Buffer>} - Resolves to a Node.js Buffer containing PNG image bytes
 * @throws {QRValidationError} If input or options fail validation
 * @throws {QRGenerationError} If underlying QR generation fails
 */
export async function generateBuffer(textOrSegments, options = {}) {
    validateQRInput(textOrSegments);
    const resolvedOptions = resolveQROptions(options);

    try {
        const buffer = await QRCode.toBuffer(textOrSegments, {
            ...resolvedOptions,
            type: 'png',
        });
        return buffer;
    } catch (error) {
        if (error instanceof QRValidationError) throw error;
        throw new QRGenerationError(
            `Failed to generate QR Buffer: ${error.message || String(error)}`,
            {
                cause: error,
            },
        );
    }
}

/**
 * Generates an SVG XML string representation of a QR Code.
 *
 * @param {string|Array} textOrSegments - Text, URL, or segments array
 * @param {object} [options={}] - Custom QR options
 * @returns {Promise<string>} - Resolves to SVG XML string (e.g. '<svg ...>...</svg>')
 * @throws {QRValidationError} If input or options fail validation
 * @throws {QRGenerationError} If underlying QR generation fails
 */
export async function generateSVG(textOrSegments, options = {}) {
    validateQRInput(textOrSegments);
    const resolvedOptions = resolveQROptions(options);

    try {
        const svgString = await QRCode.toString(textOrSegments, {
            ...resolvedOptions,
            type: 'svg',
        });
        return svgString;
    } catch (error) {
        if (error instanceof QRValidationError) throw error;
        throw new QRGenerationError(
            `Failed to generate QR SVG: ${error.message || String(error)}`,
            {
                cause: error,
            },
        );
    }
}

/**
 * Generates a UTF-8 / ANSI terminal string representation of a QR Code (ideal for CLI or server logs).
 *
 * @param {string|Array} textOrSegments - Text, URL, or segments array
 * @param {object} [options={}] - Custom QR options (small: boolean, etc.)
 * @returns {Promise<string>} - Resolves to terminal-renderable string
 * @throws {QRValidationError} If input or options fail validation
 * @throws {QRGenerationError} If underlying QR generation fails
 */
export async function generateTerminal(textOrSegments, options = {}) {
    validateQRInput(textOrSegments);
    const resolvedOptions = resolveQROptions(options);

    try {
        const terminalString = await QRCode.toString(textOrSegments, {
            ...resolvedOptions,
            type: 'terminal',
        });
        return terminalString;
    } catch (error) {
        if (error instanceof QRValidationError) throw error;
        throw new QRGenerationError(
            `Failed to generate QR Terminal string: ${error.message || String(error)}`,
            {
                cause: error,
            },
        );
    }
}

/**
 * Saves a generated QR Code directly to a file on disk.
 *
 * @param {string} filePath - Destination file path (format guessed from extension: .png, .svg, .txt)
 * @param {string|Array} textOrSegments - Text, URL, or segments array
 * @param {object} [options={}] - Custom QR options
 * @returns {Promise<void>}
 * @throws {QRValidationError} If parameters or options fail validation
 * @throws {QRGenerationError} If file writing fails
 */
export async function generateToFile(filePath, textOrSegments, options = {}) {
    if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
        throw new QRValidationError('filePath must be a non-empty string');
    }

    validateQRInput(textOrSegments);
    const resolvedOptions = resolveQROptions(options);

    try {
        await QRCode.toFile(filePath, textOrSegments, resolvedOptions);
    } catch (error) {
        if (error instanceof QRValidationError) throw error;
        throw new QRGenerationError(
            `Failed to save QR to file '${filePath}': ${error.message || String(error)}`,
            {
                cause: error,
            },
        );
    }
}

/**
 * Pipes a PNG QR Code stream directly to a writable stream (e.g. Express HTTP response).
 *
 * @param {import('stream').Writable} stream - Target writable stream
 * @param {string|Array} textOrSegments - Text, URL, or segments array
 * @param {object} [options={}] - Custom QR options
 * @returns {Promise<void>}
 * @throws {QRValidationError} If stream or input fails validation
 * @throws {QRGenerationError} If streaming fails
 */
export async function pipeQRCodeToStream(stream, textOrSegments, options = {}) {
    if (!stream || typeof stream.write !== 'function') {
        throw new QRValidationError('stream must be a valid Writable stream');
    }

    validateQRInput(textOrSegments);
    const resolvedOptions = resolveQROptions(options);

    try {
        await QRCode.toFileStream(stream, textOrSegments, resolvedOptions);
    } catch (error) {
        if (error instanceof QRValidationError) throw error;
        throw new QRGenerationError(`Failed to stream QR Code: ${error.message || String(error)}`, {
            cause: error,
        });
    }
}

/**
 * Unified helper function to generate QR codes in any requested format.
 *
 * @param {object} params
 * @param {string|Array} params.text - Text, URL, or segments array
 * @param {'dataURL'|'buffer'|'svg'|'terminal'|'file'} [params.format='dataURL'] - Target output format
 * @param {string} [params.filePath] - Target file path if format is 'file'
 * @param {object} [params.options={}] - QR options (width, margin, scale, color, errorCorrectionLevel)
 * @returns {Promise<string|Buffer|void>}
 */
export async function generateQRCode({ text, format = 'dataURL', filePath, options = {} } = {}) {
    switch (format.toLowerCase()) {
        case 'dataurl':
        case 'data_url':
        case 'base64':
            return generateDataURL(text, options);

        case 'buffer':
        case 'png':
        case 'image':
            return generateBuffer(text, options);

        case 'svg':
        case 'xml':
            return generateSVG(text, options);

        case 'terminal':
        case 'utf8':
            return generateTerminal(text, options);

        case 'file':
            return generateToFile(filePath, text, options);

        default:
            throw new QRValidationError(
                `Unsupported format '${format}'. Valid formats are: 'dataURL', 'buffer', 'svg', 'terminal', 'file'.`,
            );
    }
}
