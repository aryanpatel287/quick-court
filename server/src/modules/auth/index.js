import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import { protect, restrictTo } from './middleware/auth.middleware.js';

export { authRouter, userRouter, adminRouter, protect, restrictTo };
