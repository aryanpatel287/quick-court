import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const docLogger = new FeatureApiDocLogger(
    '02_pdf_service.md',
    'Feature 02: PDF Generation & Document Streaming API',
    'Provides programmatic high-performance PDF rendering for invoices, receipts, and custom HTML templates.',
);

describe('02: PDF Generation & Rendering API', () => {
    afterAll(() => {
        docLogger.save();
    });

    describe('GET /api/pdf/invoice/:id', () => {
        it('should generate and stream invoice PDF (200 OK)', async () => {
            const res = await request(app)
                .get('/api/pdf/invoice/INV-2026-0042')
                .query({ inline: 'true' });

            docLogger.record({
                scenario: 'Generate Invoice PDF (Success)',
                method: 'GET',
                endpoint: '/api/pdf/invoice/INV-2026-0042',
                queryParams: { inline: 'true' },
                statusCode: res.status,
                responseBody: { message: '[Binary PDF Stream]' },
                notes: 'Generates and streams high-fidelity PDF buffer with invoice details.',
            });

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('application/pdf');
        });
    });

    describe('GET /api/pdf/invoice/:id/preview', () => {
        it('should preview invoice HTML template (200 OK)', async () => {
            const res = await request(app).get('/api/pdf/invoice/INV-2026-0042/preview');

            docLogger.record({
                scenario: 'Preview Invoice Template HTML',
                method: 'GET',
                endpoint: '/api/pdf/invoice/INV-2026-0042/preview',
                statusCode: res.status,
                responseBody: { preview: '[Raw HTML Document String]' },
                notes: 'Returns raw HTML for rapid template inspection and styling previews.',
            });

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('text/html');
        });
    });

    describe('GET /api/pdf/receipt/:id', () => {
        it('should generate and stream payment receipt PDF (200 OK)', async () => {
            const res = await request(app).get('/api/pdf/receipt/REC-2026-0099');

            docLogger.record({
                scenario: 'Generate Payment Receipt PDF',
                method: 'GET',
                endpoint: '/api/pdf/receipt/REC-2026-0099',
                statusCode: res.status,
                responseBody: { message: '[Binary PDF Stream]' },
                notes: 'Generates branded transaction confirmation receipt in PDF format.',
            });

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('application/pdf');
        });
    });

    describe('POST /api/pdf/render', () => {
        it('should render custom HTML string into PDF buffer (200 OK)', async () => {
            const renderPayload = {
                html: '<html><body><h1>Custom PDF Report</h1><p>Rendered via Apex Template</p></body></html>',
            };

            const res = await request(app).post('/api/pdf/render').send(renderPayload);

            docLogger.record({
                scenario: 'Render Custom HTML to PDF (Success)',
                method: 'POST',
                endpoint: '/api/pdf/render',
                requestBody: renderPayload,
                statusCode: res.status,
                responseBody: { message: '[Binary PDF Stream]' },
                notes: 'Renders custom user-supplied HTML payload into a compiled PDF stream.',
            });

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('application/pdf');
        });

        it('should return 400 when HTML payload is missing', async () => {
            const res = await request(app).post('/api/pdf/render').send({});

            docLogger.record({
                scenario: 'Render Custom HTML (Missing Body Error)',
                method: 'POST',
                endpoint: '/api/pdf/render',
                requestBody: {},
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns 400 error when required html parameter is omitted.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});
