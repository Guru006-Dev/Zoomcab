const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    retryStrategy: (times) => Math.min(times * 200, 5000),
    maxRetriesPerRequest: 1,
    // Fail commands immediately while disconnected instead of queueing them,
    // so callers can fall back to Postgres without waiting on retries.
    enableOfflineQueue: false,
});

let lastErrorLogged = 0;
redis.on('ready', () => console.log('[REDIS] Connected'));
redis.on('error', (err) => {
    // Log at most every 30s so a missing Redis doesn't flood the console.
    if (Date.now() - lastErrorLogged > 30000) {
        console.error('[REDIS] Unavailable:', err.message, '— falling back to Postgres-only mode');
        lastErrorLogged = Date.now();
    }
});

redis.isReady = () => redis.status === 'ready';

module.exports = redis;
