import Redis from 'ioredis';
import envConfig from './env.config.js';

const redis = new Redis({
    host: envConfig.REDIS_HOST,
    port: Number(envConfig.REDIS_PORT),
    password: envConfig.REDIS_PASSWORD,

    connectTimeout: 10000, //ms

    retryStrategy(times) {
        if (times > 10) {
            console.error('Redis retry attempts exhausted');
            return null;
        }

        const delay = Math.min(times * 200, 2000);

        console.log(`Retrying Redis connection in ${delay}ms...`);

        return delay;
    },

    maxRetriesPerRequest: 3,

    enableReadyCheck: true,
});

redis.on('connect', () => {
    console.log('Redis socket connected');
});

redis.on('ready', () => {
    console.log('Redis ready');
});

redis.on('reconnecting', () => {
    console.log('Redis reconnecting...');
});

redis.on('close', () => {
    console.log('Redis connection closed');
});

redis.on('end', () => {
    console.log('Redis connection ended');
});

redis.on('error', (err) => {
    console.error('Redis error:', err.message);
});

export default redis;
