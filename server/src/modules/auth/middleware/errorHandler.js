import envConfig from '../../../config/env.config.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export function errorHandler(err, req, res, _next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    const message = err.message || 'Something went wrong';
    const errorDetails = envConfig.IS_PRODUCTION ? null : err.stack || err.toString();

    console.error('API Error:', err);

    return sendResponse({
        res,
        statusCode: err.statusCode,
        message,
        success: false,
        error: errorDetails,
    });
}
