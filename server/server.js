import 'dotenv/config';
import app from './src/app.js';
import { connectToDatabase } from './src/config/database.config.js';
import envConfig from './src/config/env.config.js';
import './src/cron/cleanup.cron.js';

const PORT = envConfig.SERVER_PORT || 3000;

connectToDatabase();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
