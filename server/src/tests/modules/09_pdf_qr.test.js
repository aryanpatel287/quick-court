import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const logger = new FeatureApiDocLogger(
    '09_pdf_qr.md',
    'Feature 09: PDF Documents & QR Code Generators API',
    'Document generation engine providing downloadable PDF invoices and payment receipts, HTML previewing, dynamic HTML-to-PDF rendering, and multi-format QR code generation (PNG, SVG, DataURL).',
);

jest.setTimeout(60000);

afterAll(() => {
    logger.save();
});

describe('09: PDF Documents & QR Code Generation', () => {
    describe('1. PDF Generation Endpoints', () => {
        it('1.1 Should generate and stream invoice PDF via GET /api/pdf/invoice/:id', async () => {
            const res = await request(app).get('/api/pdf/invoice/INV-2026-TEST');

            logger.record({
                scenario: 'Generate Invoice PDF',
                method: 'GET',
                endpoint: '/api/pdf/invoice/INV-2026-TEST',
                statusCode: res.statusCode,
                responseBody: {
                    contentType: res.headers['content-type'],
                    sizeBytes: res.body?.length || 0,
                },
                notes: 'Compiles invoice template and streams downloadable PDF binary stream.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/application\/pdf/);
        });

        it('1.2 Should preview invoice HTML in browser via GET /api/pdf/invoice/:id/preview', async () => {
            const res = await request(app).get('/api/pdf/invoice/INV-2026-TEST/preview');

            logger.record({
                scenario: 'Preview Invoice HTML Template',
                method: 'GET',
                endpoint: '/api/pdf/invoice/INV-2026-TEST/preview',
                statusCode: res.statusCode,
                responseBody: { contentType: res.headers['content-type'] },
                notes: 'Renders raw HTML template directly for dev verification and styling review.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/text\/html/);
        });

        it('1.3 Should generate and stream payment receipt PDF via GET /api/pdf/receipt/:id', async () => {
            const res = await request(app).get('/api/pdf/receipt/REC-2026-TEST');

            logger.record({
                scenario: 'Generate Payment Receipt PDF',
                method: 'GET',
                endpoint: '/api/pdf/receipt/REC-2026-TEST',
                statusCode: res.statusCode,
                responseBody: { contentType: res.headers['content-type'] },
                notes: 'Generates official payment settlement receipt with transaction metadata.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/application\/pdf/);
        });

        it('1.4 Should render arbitrary HTML to PDF Buffer via POST /api/pdf/render', async () => {
            const htmlPayload = {
                html: '<!DOCTYPE html><html><body><h1>Court Reservation Pass</h1><p>Booking Confirmed for Center Court 1</p></body></html>',
            };

            const res = await request(app).post('/api/pdf/render').send(htmlPayload);

            logger.record({
                scenario: 'Render Custom HTML to PDF',
                method: 'POST',
                endpoint: '/api/pdf/render',
                requestBody: htmlPayload,
                statusCode: res.statusCode,
                responseBody: { contentType: res.headers['content-type'] },
                notes: 'Dynamic rendering utility converting client/server HTML into formatted PDF buffers.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/application\/pdf/);
        });

        it('1.5 Should reject PDF rendering request if HTML content is missing (400)', async () => {
            const res = await request(app).post('/api/pdf/render').send({});

            logger.record({
                scenario: 'Render PDF Missing HTML (Rejected)',
                method: 'POST',
                endpoint: '/api/pdf/render',
                requestBody: {},
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('2. QR Code Generation Endpoints', () => {
        it('2.1 Should generate QR code DataURL via POST /api/qr/generate', async () => {
            const qrPayload = {
                text: 'https://quickcourt.io/verify/booking/QC-2026-999',
                format: 'dataurl',
            };

            const res = await request(app).post('/api/qr/generate').send(qrPayload);

            logger.record({
                scenario: 'Generate QR Code as DataURL',
                method: 'POST',
                endpoint: '/api/qr/generate',
                requestBody: qrPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Generates Base64 data URL string ready for inline img src rendering.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(typeof res.body.data.qr).toBe('string');
            expect(res.body.data.qr).toMatch(/^data:image\/png;base64,/);
        });

        it('2.2 Should generate QR code binary buffer via POST /api/qr/generate', async () => {
            const qrPayload = {
                text: 'https://quickcourt.io/verify/booking/QC-2026-999',
                format: 'buffer',
            };

            const res = await request(app).post('/api/qr/generate').send(qrPayload);

            logger.record({
                scenario: 'Generate QR Code as PNG Binary Buffer',
                method: 'POST',
                endpoint: '/api/qr/generate',
                requestBody: qrPayload,
                statusCode: res.statusCode,
                responseBody: { contentType: res.headers['content-type'] },
            });

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/image\/png/);
        });

        it('2.3 Should reject QR code generation if text is missing (400)', async () => {
            const res = await request(app).post('/api/qr/generate').send({ format: 'dataurl' });

            logger.record({
                scenario: 'Generate QR Missing Text (Rejected)',
                method: 'POST',
                endpoint: '/api/qr/generate',
                requestBody: { format: 'dataurl' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('2.4 Should stream QR code on the fly via GET /api/qr/generate', async () => {
            const res = await request(app).get('/api/qr/generate').query({
                text: 'https://quickcourt.io/check-in/QC-999',
                format: 'png',
                width: 250,
            });

            logger.record({
                scenario: 'Stream QR Code on the Fly (GET)',
                method: 'GET',
                endpoint: '/api/qr/generate',
                queryParams: {
                    text: 'https://quickcourt.io/check-in/QC-999',
                    format: 'png',
                    width: 250,
                },
                statusCode: res.statusCode,
                responseBody: { contentType: res.headers['content-type'] },
                notes: 'Permits dynamic embedding of verifiable reservation check-in barcodes.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/image\/png/);
        });

        it('2.5 Should stream SVG QR code via GET /api/qr/generate?format=svg', async () => {
            const res = await request(app).get('/api/qr/generate').query({
                text: 'https://quickcourt.io/check-in/QC-999',
                format: 'svg',
            });

            logger.record({
                scenario: 'Stream Vector SVG QR Code',
                method: 'GET',
                endpoint: '/api/qr/generate',
                queryParams: { text: 'https://quickcourt.io/check-in/QC-999', format: 'svg' },
                statusCode: res.statusCode,
                responseBody: { contentType: res.headers['content-type'] },
            });

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/image\/svg\+xml/);
        });
    });
});
