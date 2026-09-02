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

app.use(errorHandler);

export default app;
