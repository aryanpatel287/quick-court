import { Router } from 'express';
import {
    generateInvoicePdf,
    generateReceiptPdf,
    previewInvoiceHtml,
    renderCustomHtmlPdf,
} from '../controllers/pdf.controller.js';

const pdfRouter = Router();

/**
 * @route   GET /api/pdf/invoice/:id
 * @desc    Generate and stream invoice PDF (supports ?inline=true)
 * @access  Public / Protected depending on business scope
 */
pdfRouter.get('/invoice/:id', generateInvoicePdf);

/**
 * @route   GET /api/pdf/invoice/:id/preview
 * @desc    Preview raw invoice HTML template in browser
 * @access  Public / Dev
 */
pdfRouter.get('/invoice/:id/preview', previewInvoiceHtml);

/**
 * @route   GET /api/pdf/receipt/:id
 * @desc    Generate and stream receipt PDF
 * @access  Public / Protected
 */
pdfRouter.get('/receipt/:id', generateReceiptPdf);

/**
 * @route   POST /api/pdf/render
 * @desc    Render provided HTML string to PDF Buffer
 * @access  Protected
 */
pdfRouter.post('/render', renderCustomHtmlPdf);

export default pdfRouter;
