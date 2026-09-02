import { renderPdfFromHtml } from 'html-pdf-lite';
import { PDFValidationError, PDFGenerationError } from './errors.pdf.service.js';
import { resolvePDFOptions } from './options.pdf.service.js';

/**
 * Generates a PDF Buffer from an HTML string using html-pdf-lite.
 *
 * @param {object} params
 * @param {string} params.html - The complete HTML string to render
 * @param {import('html-pdf-lite').RenderOptions} [params.options={}] - Optional PDF rendering options
 * @returns {Promise<Buffer>} - Resolves to a Node.js Buffer containing the generated PDF
 * @throws {PDFValidationError} If HTML is missing or invalid
 * @throws {PDFGenerationError} If underlying PDF generation fails
 */
export async function makePDF({ html, options = {} } = {}) {
    if (html === undefined || html === null) {
        throw new PDFValidationError(
            'makePDF requires an HTML string (received null or undefined)',
        );
    }

    if (typeof html !== 'string') {
        throw new PDFValidationError(`makePDF requires an HTML string (received ${typeof html})`);
    }

    if (html.trim().length === 0) {
        throw new PDFValidationError('makePDF requires a non-empty HTML string');
    }

    const resolvedOptions = resolvePDFOptions(options);

    try {
        const pdfBuffer = await renderPdfFromHtml(html, resolvedOptions);

        if (!Buffer.isBuffer(pdfBuffer)) {
            return Buffer.from(pdfBuffer);
        }

        return pdfBuffer;
    } catch (error) {
        throw new PDFGenerationError(`Failed to generate PDF: ${error.message || String(error)}`, {
            cause: error,
        });
    }
}
