import { PDFValidationError } from './errors.pdf.service.js';

/**
 * Default options applied to all PDF renderings in Apex
 */
export const defaultPDFOptions = {
    margins: {
        top: 36,
        right: 36,
        bottom: 36,
        left: 36,
    },
    rootSelector: 'body',
    allowScripts: false,
    fetchExternalCss: false,
    enableInternalAnchors: true,
    autoResolveFonts: true,
    autoResolveEmojiFont: true,
    autoDownloadEmojiFont: false,
    svgScale: 2,
    svgDpi: 72,
    loadTimeoutMs: 5000,
    externalCssTimeoutMs: 5000,
    imgLoadTimeoutMs: 5000,
    ignoreInvalidImages: false,
};

/**
 * Validates and merges user options with Apex default options
 *
 * @param {object} [userOptions={}]
 * @returns {object} Merged configuration for html-pdf-lite
 */
export function resolvePDFOptions(userOptions = {}) {
    if (userOptions !== null && typeof userOptions !== 'object') {
        throw new PDFValidationError('options must be an object');
    }

    const merged = {
        ...defaultPDFOptions,
        ...userOptions,
    };

    if (userOptions.margins && typeof userOptions.margins === 'object') {
        merged.margins = {
            ...defaultPDFOptions.margins,
            ...userOptions.margins,
        };
    }

    if (userOptions.fonts && typeof userOptions.fonts === 'object') {
        merged.fonts = {
            ...(defaultPDFOptions.fonts || {}),
            ...userOptions.fonts,
        };
    }

    if (merged.allowScripts === true) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(
                '[PDF Security Warning] allowScripts is enabled for makePDF. Ensure HTML is sanitized.',
            );
        }
    }

    return merged;
}
