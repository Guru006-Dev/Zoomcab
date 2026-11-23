/**
 * Shared setup for integration tests: a clean Postgres database, the real server on a
 * random port, and small helpers for users and sockets.
 * Needs Postgres with PostGIS (DATABASE_URL); works with or without Redis (CI runs both).
 * Locally: `docker compose up -d postgres` then `npm test`.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DEMO_MODE = 'false';

const { io: ioClient } = require('socket.io-client');
const redis = require('../redisClient');
const db = require('../db');

let baseUrl;
let serverModule;
const sockets = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wait briefly for Redis; report whether it's there. */
async function waitForRedis(ms = 2000) {
    const until = Date.now() + ms;
    while (!redis.isReady() && Date.now() < until) await sleep(50);
    return redis.isReady();
}

async function startServer() {
    const redisUp = await waitForRedis();
    if (redisUp) await redis.flushdb(); // tests reuse small numeric ids; start clean
    await db.migrate();
    await db.query('TRUNCATE reviews, rides, drivers, users RESTART IDENTITY CASCADE');
    serverModule = require('../server');
    const port = await serverModule.start(0);
    baseUrl = `http://127.0.0.1:${port}`;
    return { baseUrl, redisUp };
}

async function stopServer() {
    sockets.forEach((s) => s.close());
    if (serverModule) await serverModule.stop();
    redis.disconnect();
}

async function api(method, route, body, token) {
    const res = await fetch(`${baseUrl}/api${route}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
}

let counter = 0;
/** Register + log in a user and open an authenticated socket that records every event. */
async function createUser(role) {
    const username = `${role}${process.pid}_${++counter}`;
    await api('POST', '/auth/register', { username, password: 'pw123456', role });
    const login = await api('POST', '/auth/login', { username, password: 'pw123456' });
    const socket = ioClient(baseUrl, { auth: { token: login.body.token }, transports: ['websocket'] });
    sockets.push(socket);
    const events = [];
    socket.onAny((name, data) => events.push({ name, data }));
    await new Promise((resolve, reject) => {
        socket.on('connect', resolve);
        socket.on('connect_error', reject);
    });
    return {
        ...login.body.user,
        token: login.body.token,
        socket,
        events,
        received: (name) => events.filter((e) => e.name === name).map((e) => e.data),
    };
}

/** Poll until fn() is truthy (events arrive asynchronously). */
async function eventually(fn, ms = 2000) {
    const until = Date.now() + ms;
    while (Date.now() < until) {
        if (await fn()) return true;
        await sleep(25);
    }
    return Boolean(await fn());
}

module.exports = { startServer, stopServer, api, createUser, eventually, sleep };
