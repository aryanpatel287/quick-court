import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import {
    generateDataURL,
    generateBuffer,
    generateSVG,
    generateTerminal,
    generateQRCode,
    resolveQROptions,
    QRValidationError,
} from '../../services/qr/index.qr.service.js';

const docLogger = new FeatureApiDocLogger(
    '03_qr_service.md',
    'Feature 03: QR Code Generation & Rendering API',
    'Provides high-performance multi-format QR Code generation (DataURL, PNG Buffer, SVG XML, Terminal) for URLs, contact data, authentication tokens, and arbitrary text.',
);

describe('03: QR Code Generation Service & API', () => {
    afterAll(() => {
        docLogger.save();
    });

    describe('Direct QR Service Unit Tests', () => {
        it('should generate valid Base64 Data URL', async () => {
            const dataUrl = await generateDataURL('https://apex-template.io');
            expect(dataUrl).toMatch(/^data:image\/png;base64,/);
        });

        it('should generate valid PNG Buffer', async () => {
            const buffer = await generateBuffer('https://apex-template.io');
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(0);
        });

        it('should generate valid SVG XML string', async () => {
            const svg = await generateSVG('https://apex-template.io');
            expect(typeof svg).toBe('string');
            expect(svg).toContain('<svg');
            expect(svg).toContain('</svg>');
        });

        it('should generate valid Terminal string', async () => {
            const terminal = await generateTerminal('https://apex-template.io', { small: true });
            expect(typeof terminal).toBe('string');
            expect(terminal.length).toBeGreaterThan(0);
        });

        it('should generate QR code using unified generateQRCode helper', async () => {
            const dataUrl = await generateQRCode({
                text: 'https://apex-template.io',
                format: 'dataURL',
            });
            expect(dataUrl).toMatch(/^data:image\/png;base64,/);

            const svg = await generateQRCode({
                text: 'https://apex-template.io',
                format: 'svg',
            });
            expect(svg).toContain('<svg');
        });

        it('should throw QRValidationError on empty or invalid text', async () => {
            await expect(generateDataURL('')).rejects.toThrow(QRValidationError);
            await expect(generateDataURL(null)).rejects.toThrow(QRValidationError);
        });

        it('should throw QRValidationError on invalid errorCorrectionLevel', () => {
            expect(() => resolveQROptions({ errorCorrectionLevel: 'INVALID' })).toThrow(
                QRValidationError,
            );
        });

        it('should throw QRValidationError on invalid hex colors', () => {
            expect(() => resolveQROptions({ color: { dark: 'not-a-color' } })).toThrow(
                QRValidationError,
            );
        });
    });

    describe('POST /api/qr/generate', () => {
        it('should generate QR code Data URL in JSON response (200 OK)', async () => {
            const payload = {
                text: 'https://apex-template.io/demo',
                format: 'dataURL',
                options: {
                    errorCorrectionLevel: 'H',
                    margin: 2,
                },
            };

            const res = await request(app).post('/api/qr/generate').send(payload);

            docLogger.record({
                scenario: 'Generate QR Code Data URL (Success)',
                method: 'POST',
                endpoint: '/api/qr/generate',
                requestBody: payload,
                statusCode: res.status,
                responseBody: {
                    success: true,
                    message: 'QR code generated successfully',
                    data: {
                        qr: 'data:image/png;base64,...',
                        format: 'dataurl',
                    },
                },
                notes: 'Generates Base64 Data URL suitable for direct insertion into img tags.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.qr).toMatch(/^data:image\/png;base64,/);
            expect(res.body.data.format).toBe('dataurl');
        });

        it('should generate QR code SVG in JSON response (200 OK)', async () => {
            const payload = {
                text: 'https://apex-template.io/docs',
                format: 'svg',
            };

            const res = await request(app).post('/api/qr/generate').send(payload);

            docLogger.record({
                scenario: 'Generate QR Code SVG String (Success)',
                method: 'POST',
                endpoint: '/api/qr/generate',
                requestBody: payload,
                statusCode: res.status,
                responseBody: {
                    success: true,
                    message: 'QR code generated successfully',
                    data: {
                        qr: '<svg ...>...</svg>',
                        format: 'svg',
                    },
                },
                notes: 'Returns lightweight scalable SVG markup.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.qr).toContain('<svg');
        });

        it('should stream binary PNG buffer when format is buffer (200 OK)', async () => {
            const payload = {
                text: 'https://apex-template.io/download',
                format: 'buffer',
            };

            const res = await request(app).post('/api/qr/generate').send(payload);

            docLogger.record({
                scenario: 'Stream PNG Binary Buffer (Success)',
                method: 'POST',
                endpoint: '/api/qr/generate',
                requestBody: payload,
                statusCode: res.status,
                responseBody: { message: '[Binary PNG Stream]' },
                notes: 'Streams PNG image buffer directly with appropriate image/png Content-Type.',
            });

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('image/png');
        });

        it('should return 400 Bad Request when text is missing', async () => {
            const res = await request(app).post('/api/qr/generate').send({});

            docLogger.record({
                scenario: 'Missing Text Parameter Error',
                method: 'POST',
                endpoint: '/api/qr/generate',
                requestBody: {},
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns 400 when text parameter is omitted or empty.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/qr/generate', () => {
        it('should stream PNG QR code image via GET query params (200 OK)', async () => {
            const res = await request(app)
                .get('/api/qr/generate')
                .query({ text: 'https://apex-template.io' });

            docLogger.record({
                scenario: 'GET Stream PNG QR Code',
                method: 'GET',
                endpoint: '/api/qr/generate',
                queryParams: { text: 'https://apex-template.io' },
                statusCode: res.status,
                responseBody: { message: '[Binary PNG Stream]' },
                notes: 'Allows embedding QR code images directly into HTML <img src="/api/qr/generate?text=...">',
            });

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('image/png');
        });

        it('should stream SVG QR code via GET when format=svg (200 OK)', async () => {
            const res = await request(app)
                .get('/api/qr/generate')
                .query({ text: 'https://apex-template.io', format: 'svg' });

            docLogger.record({
                scenario: 'GET Stream SVG QR Code',
                method: 'GET',
                endpoint: '/api/qr/generate',
                queryParams: { text: 'https://apex-template.io', format: 'svg' },
                statusCode: res.status,
                responseBody: { message: '[Scalable Vector Graphics Stream]' },
                notes: 'Streams scalable vector XML representation directly.',
            });

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('image/svg+xml');
        });

        it('should accept custom colors and margin query params (200 OK)', async () => {
            const res = await request(app).get('/api/qr/generate').query({
                text: 'https://apex-template.io',
                colorDark: '4f46e5',
                colorLight: 'f3f4f6',
                margin: '2',
                width: '256',
            });

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('image/png');
        });

        it('should return 400 Bad Request if query text is missing', async () => {
            const res = await request(app).get('/api/qr/generate');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});
