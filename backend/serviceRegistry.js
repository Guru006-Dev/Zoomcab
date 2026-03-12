/**
 * SERVICE REGISTRY — Registry-based dynamic service discovery using Redis.
 * Each service registers on boot, sends heartbeats, and deregisters on shutdown.
 */
const redis = require('./redisClient');

const HEARTBEAT_INTERVAL = 10000; // 10s
const TTL_SECONDS = 30;           // Auto-deregister after 30s without heartbeat

class ServiceRegistry {
    constructor(serviceName, host, port) {
        this.serviceName = serviceName;
        this.host = host;
        this.port = port;
        this.instanceId = `${host}:${port}`;
        this.heartbeatTimer = null;
    }

    /** Register this instance in the service registry */
    async register() {
        const key = `service:${this.serviceName}`;
        const instanceKey = `${key}:${this.instanceId}`;

        await redis.sadd(key, this.instanceId);
        await redis.set(instanceKey, JSON.stringify({
            status: 'healthy',
            registeredAt: Date.now(),
            host: this.host,
            port: this.port,
        }), 'EX', TTL_SECONDS);

        // Start heartbeat
        this.heartbeatTimer = setInterval(async () => {
            try {
                await redis.expire(instanceKey, TTL_SECONDS);
            } catch (err) {
                console.error(`[REGISTRY] Heartbeat failed for ${this.instanceId}:`, err.message);
            }
        }, HEARTBEAT_INTERVAL);

        console.log(`[REGISTRY] Registered ${this.serviceName} → ${this.instanceId}`);
    }

    /** Graceful deregistration */
    async deregister() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        const key = `service:${this.serviceName}`;
        await redis.srem(key, this.instanceId);
        await redis.del(`${key}:${this.instanceId}`);
        console.log(`[REGISTRY] Deregistered ${this.serviceName} → ${this.instanceId}`);
    }

    /** Discover all healthy instances of a service */
    static async discover(serviceName) {
        const key = `service:${serviceName}`;
        const instances = await redis.smembers(key);
        const healthy = [];

        for (const inst of instances) {
            const data = await redis.get(`${key}:${inst}`);
            if (data) {
                healthy.push({ instanceId: inst, ...JSON.parse(data) });
            } else {
                // TTL expired — auto-deregister dead instance
                await redis.srem(key, inst);
            }
        }
        return healthy;
    }

    /** Least-connections load balancing */
    static async selectInstance(serviceName) {
        const instances = await ServiceRegistry.discover(serviceName);
        if (instances.length === 0) throw new Error(`No instances of ${serviceName} available`);

        let selected = instances[0];
        let minConn = Infinity;

        for (const inst of instances) {
            const conn = parseInt(await redis.get(`connections:${inst.instanceId}`) || '0');
            if (conn < minConn) {
                minConn = conn;
                selected = inst;
            }
        }

        await redis.incr(`connections:${selected.instanceId}`);
        return selected;
    }

    static async releaseConnection(instanceId) {
        const val = await redis.get(`connections:${instanceId}`);
        if (val && parseInt(val) > 0) {
            await redis.decr(`connections:${instanceId}`);
        }
    }
}

module.exports = ServiceRegistry;
