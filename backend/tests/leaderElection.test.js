/**
 * Needs a real Redis (CI provides one). Each test is skipped when Redis isn't reachable,
 * unless REQUIRE_REDIS=true, in which case a missing Redis fails the run.
 */
const redis = require('../redisClient');
const LeaderElection = require('../leaderElection');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const service = `test-election-${process.pid}`;
let redisUp = false;

beforeAll(async () => {
    const until = Date.now() + 3000;
    while (!redis.isReady() && Date.now() < until) await sleep(50);
    redisUp = redis.isReady();
    if (!redisUp && process.env.REQUIRE_REDIS === 'true') {
        throw new Error('REQUIRE_REDIS=true but Redis is not reachable');
    }
});
afterAll(() => redis.disconnect());

const withRedis = (name, fn, timeout) => test(name, async () => {
    if (!redisUp) {
        console.warn(`Skipped "${name}": Redis not available`);
        return;
    }
    await fn();
}, timeout);

describe('leader election (highest live id wins)', () => {
    withRedis('the highest live instance becomes leader', async () => {
        const a = new LeaderElection('node-a', service);
        const b = new LeaderElection('node-b', service);
        await a.start();
        await b.start();
        try {
            expect(b.isLeader).toBe(true);
            await a.attemptElection();
            expect(a.isLeader).toBe(false);
            expect(a.leaderId).toBe('node-b');
        } finally {
            await a.stop();
            await b.stop();
        }
    });

    withRedis('a follower takes over when the leader dies', async () => {
        const name = `${service}-failover`;
        const a = new LeaderElection('node-a', name);
        const b = new LeaderElection('node-b', name);
        await a.start();
        await b.start();
        try {
            expect(b.isLeader).toBe(true);
            await b.stop(); // leader goes away: its heartbeat key is removed

            // Followers check the leader's heartbeat every 5 s.
            const until = Date.now() + 12000;
            while (!a.isLeader && Date.now() < until) await sleep(200);
            expect(a.isLeader).toBe(true);
        } finally {
            await a.stop();
        }
    }, 20000);
});
