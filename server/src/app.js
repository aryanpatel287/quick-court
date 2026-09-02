import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import envConfig from './config/env.config.js';
import { authRouter, userRouter, adminRouter } from './modules/auth/index.js';
import aiRouter from './modules/ai/routes/ai.routes.js';
import { ragRouter } from './modules/rag/index.js';
import { pdfRouter } from './modules/pdf/index.js';
import { qrRouter } from './modules/qr/index.js';
import { facilityRouter } from './modules/facility/index.js';
import { courtRouter } from './modules/court/index.js';
import { availabilityRouter } from './modules/availability/index.js';
import { venueRouter } from './modules/venue/index.js';
import { homeRouter } from './modules/home/index.js';
import { ownerRouter } from './modules/owner/index.js';
import { reviewRouter } from './modules/review/index.js';
import { errorHandler } from './modules/auth/middleware/errorHandler.js';
import passport from './config/passport.config.js';

const app = express();

app.use(express.static(path.join(import.meta.dirname, 'public')));
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: envConfig.CLIENT_ORIGINS,
        credentials: true,
    }),
);
app.use(morgan('combined'));
app.use(passport.initialize());

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);
app.use('/api/rag', ragRouter);
app.use('/api/pdf', pdfRouter);
app.use('/api/qr', qrRouter);

// DEV 2 - Facility Supply Management
app.use('/api/owner/facilities', facilityRouter);
app.use('/api/owner', courtRouter);
app.use('/api/owner', availabilityRouter);

// DEV 4 - User Discovery, Home, Owner Analytics & Reviews
app.use('/api/venues', venueRouter);
app.use('/api/home', homeRouter);
app.use('/api/owner', ownerRouter);
app.use('/api', reviewRouter);

app.use(errorHandler);

export default app;
