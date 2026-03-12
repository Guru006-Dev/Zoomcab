/**
 * LEADER ELECTION — Bully Algorithm for Ride Matching Service cluster.
 * The instance with the highest ID becomes the leader.
 * If the leader crashes (heartbeat expires), an election is triggered.
 */
const redis = require('./redisClient');

const HEARTBEAT_INTERVAL = 5000; // 5s
const ELECTION_TIMEOUT = 10000;  // 10s
const LEADER_TTL = 15;           // 15s TTL on leader heartbeat

class LeaderElection {
    constructor(instanceId, serviceName) {
        this.instanceId = instanceId;
        this.serviceName = serviceName;
        this.isLeader = false;
        this.leaderId = null;
        this.heartbeatTimer = null;
        this.monitorTimer = null;
    }

    /** Start participating in leader election */
    async start() {
        // Register self
        await redis.sadd(`${this.serviceName}:instances`, this.instanceId);

        // Try to become leader
        await this.attemptElection();

        // Start heartbeat if leader
        if (this.isLeader) this._startHeartbeat();

        // Monitor leader health
        this._startMonitoring();

        console.log(`[LEADER] Instance ${this.instanceId} started. Leader: ${this.leaderId} ${this.isLeader ? '(SELF)' : ''}`);
    }

    /** Bully election: highest ID wins */
    async attemptElection() {
        const instances = await redis.smembers(`${this.serviceName}:instances`);
        const higherInstances = instances.filter(i => i > this.instanceId);

        if (higherInstances.length === 0) {
            // I have the highest ID → become leader
            await this._declareLeader();
        } else {
            // Check if any higher instance is alive
            let anyAlive = false;
            for (const inst of higherInstances) {
                const alive = await redis.get(`${this.serviceName}:heartbeat:${inst}`);
                if (alive) {
                    anyAlive = true;
                    this.leaderId = inst;
                    break;
                }
            }

            if (!anyAlive) {
                await this._declareLeader();
            } else {
                this.isLeader = false;
                // Read who the current leader is
                const currentLeader = await redis.get(`${this.serviceName}:leader`);
                if (currentLeader) this.leaderId = currentLeader;
            }
        }
    }

    async _declareLeader() {
        this.isLeader = true;
        this.leaderId = this.instanceId;
        await redis.set(`${this.serviceName}:leader`, this.instanceId);
        await redis.set(`${this.serviceName}:heartbeat:${this.instanceId}`, 'alive', 'EX', LEADER_TTL);
        console.log(`[LEADER] 🏆 Instance ${this.instanceId} is now the LEADER`);
    }

    _startHeartbeat() {
        this.heartbeatTimer = setInterval(async () => {
            if (this.isLeader) {
                await redis.set(
                    `${this.serviceName}:heartbeat:${this.instanceId}`,
                    'alive', 'EX', LEADER_TTL
                );
            }
        }, HEARTBEAT_INTERVAL);
    }

    _startMonitoring() {
        this.monitorTimer = setInterval(async () => {
            if (this.isLeader) return; // Leaders don't monitor themselves

            const leaderAlive = await redis.get(`${this.serviceName}:heartbeat:${this.leaderId}`);
            if (!leaderAlive) {
                console.log(`[LEADER] Leader ${this.leaderId} is DEAD. Starting election...`);
                await this.attemptElection();
                if (this.isLeader) this._startHeartbeat();
            }
        }, HEARTBEAT_INTERVAL);
    }

    async stop() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        if (this.monitorTimer) clearInterval(this.monitorTimer);
        await redis.srem(`${this.serviceName}:instances`, this.instanceId);
        await redis.del(`${this.serviceName}:heartbeat:${this.instanceId}`);
        if (this.isLeader) {
            await redis.del(`${this.serviceName}:leader`);
        }
        console.log(`[LEADER] Instance ${this.instanceId} stopped`);
    }
}

module.exports = LeaderElection;
