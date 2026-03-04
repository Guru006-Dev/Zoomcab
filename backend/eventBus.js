/**
 * EVENT BUS — Event-driven architecture using Redis Pub/Sub
 * Channels: ride:requested, ride:accepted, ride:completed, payment:processed
 */
const Redis = require('ioredis');
const redis = require('./redisClient');

let subscriber = null;
let subscriberReady = false;
let readyPromise = null;
const handlers = new Map();

function ensureSubscriber() {
    if (subscriber) return readyPromise;

    subscriber = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        retryStrategy: (times) => {
            if (times > 5) return null;
            return Math.min(times * 500, 3000);
        },
    });

    subscriber.on('error', () => { }); // Suppress errors, ioredis auto-reconnects

    subscriber.on('message', (channel, message) => {
        const channelHandlers = handlers.get(channel) || [];
        try {
            const data = JSON.parse(message);
            for (const handler of channelHandlers) {
                handler(data).catch(() => { });
            }
        } catch (e) { /* ignore */ }
    });

    readyPromise = new Promise((resolve) => {
        subscriber.on('ready', () => {
            subscriberReady = true;
            console.log('[EVENT] Subscriber connected');
            resolve();
        });
        // Also resolve after timeout to not block startup
        setTimeout(resolve, 5000);
    });

    return readyPromise;
}

class EventBus {
    static async publish(channel, data) {
        try {
            const payload = JSON.stringify({ ...data, timestamp: Date.now() });
            await redis.publish(channel, payload);
            await redis.lpush(`events:${channel}`, payload);
            await redis.ltrim(`events:${channel}`, 0, 999);
            console.log(`[EVENT] Published → ${channel}`);
        } catch (err) {
            // Non-critical — app works without events
        }
    }

    static async subscribe(channel, group, consumer, handler) {
        if (!handlers.has(channel)) {
            handlers.set(channel, []);
        }
        handlers.get(channel).push(handler);
        console.log(`[EVENT] Consumer '${consumer}' (${group}) registered on '${channel}'`);

        // Defer actual Redis subscription until connected
        try {
            await ensureSubscriber();
            if (subscriberReady) {
                await subscriber.subscribe(channel);
                console.log(`[EVENT] Subscribed to '${channel}'`);
            }
        } catch (err) {
            console.log(`[EVENT] Subscription to '${channel}' deferred`);
        }
    }
}

module.exports = EventBus;
