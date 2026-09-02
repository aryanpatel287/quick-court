import { makePDF } from '../../../services/pdf/index.pdf.service.js';
import { invoiceTemplate, receiptTemplate } from '../../../templates/index.js';
import { sendPdfResponse } from '../../../utils/response.utlis.js';

/**
 * Sample / Mock Invoice Generator for Demonstration
 */
function getSampleInvoiceData(invoiceId = 'INV-2026-0042') {
    return {
        invoiceNumber: invoiceId,
        issueDate: '2026-08-19',
        dueDate: '2026-09-18',
        status: 'PAID',
        currency: 'USD',
        company: {
            name: 'Apex CRM Solutions Inc.',
            address: '100 Innovation Way, Suite 400',
            cityStateZip: 'San Francisco, CA 94107',
            email: 'billing@apex-template.io',
            phone: '+1 (555) 019-2834',
            taxId: 'US-EIN-98-7654321',
        },
        customer: {
            name: 'Alex Mercer',
            company: 'Nexus Tech Global',
            address: '742 Evergreen Terrace',
            cityStateZip: 'Austin, TX 78701',
            email: 'alex.mercer@nexustech.io',
            phone: '+1 (555) 321-9876',
        },
        items: [
            {
                sku: 'APX-ENT-YR',
                description: 'Apex CRM Enterprise Annual Subscription (10 Seats)',
                quantity: 1,
                unitPrice: 2400.0,
            },
            {
                sku: 'APX-AI-ADDON',
                description: 'AI Copilot & Document Intelligence Addon (Monthly Pack)',
                quantity: 12,
                unitPrice: 50.0,
            },
            {
                sku: 'APX-ONBOARD',
                description: 'Dedicated Engineering Onboarding & Workflow Migration',
                quantity: 1,
                unitPrice: 500.0,
            },
        ],
        discount: 200.0,
        taxRate: 0.0825, // 8.25%
        notes: 'Thank you for choosing Apex! Wire transfer instructions are included on file.',
        paymentTerms: 'Payment due within 30 days. Late fees apply at 1.5% per month.',
    };
}

/**
 * GET /api/pdf/invoice/:id
 * Generates and streams invoice PDF
 */
export async function generateInvoicePdf(req, res, next) {
    try {
        const invoiceId = req.params.id || 'INV-2026-0042';
        const isInline = req.query.inline === 'true';

        const invoiceData = getSampleInvoiceData(invoiceId);
        const html = invoiceTemplate(invoiceData);
        const pdfBuffer = await makePDF({ html });

        return sendPdfResponse({
            res,
            pdfBuffer,
            filename: `invoice-${invoiceId}.pdf`,
            isInline,
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * GET /api/pdf/receipt/:id
 * Generates and streams payment receipt PDF
 */
export async function generateReceiptPdf(req, res, next) {
    try {
        const receiptId = req.params.id || 'REC-2026-0099';
        const isInline = req.query.inline === 'true';

        const receiptData = {
            receiptNumber: receiptId,
            paymentDate: new Date(),
            paymentMethod: 'Credit Card (Visa •••• 4242)',
            transactionId: 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            customerName: 'Alex Mercer',
            customerEmail: 'alex.mercer@nexustech.io',
            amountPaid: 3500.0,
            currency: 'USD',
            description: 'Apex CRM Enterprise Subscription Renewal (Invoice #INV-2026-0042)',
        };

        const html = receiptTemplate(receiptData);
        const pdfBuffer = await makePDF({ html });

        return sendPdfResponse({
            res,
            pdfBuffer,
            filename: `receipt-${receiptId}.pdf`,
            isInline,
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * GET /api/pdf/invoice/:id/preview
 * Returns HTML string directly for development & rapid styling preview
 */
export function previewInvoiceHtml(req, res) {
    const invoiceId = req.params.id || 'INV-2026-0042';
    const invoiceData = getSampleInvoiceData(invoiceId);
    const html = invoiceTemplate(invoiceData);

    res.set({
        'Content-Type': 'text/html; charset=utf-8',
    });
    return res.send(html);
}

/**
 * POST /api/pdf/render
 * Renders arbitrary provided HTML string to PDF Buffer
 */
export async function renderCustomHtmlPdf(req, res, next) {
    try {
        const { html, options } = req.body || {};

        if (!html) {
            return res.status(400).json({
                success: false,
                message: 'HTML content is required in request body',
            });
        }

        const pdfBuffer = await makePDF({ html, options });

        return sendPdfResponse({
            res,
            pdfBuffer,
            filename: 'document.pdf',
        });
    } catch (error) {
        return next(error);
    }
}
