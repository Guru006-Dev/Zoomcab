/**
 * DISTRIBUTED RIDE MATCHING SERVICE
 * - Geo-spatial nearest driver search using Redis GEO
 * - Distributed locking to prevent double-assignment
 * - Atomic driver status updates via Lua scripts
 * - Handles multiple concurrent ride requests
 * - Accept/Reject flow with rider-specific notifications
 */
const redis = require('./redisClient');
const db = require('../database');
const { calculateDistance } = require('../utils/geo');
const EventBus = require('./eventBus');

// ─── Lua script: Atomically check driver availability and assign ───
const ASSIGN_DRIVER_LUA = `
local driverKey = KEYS[1]
local status = redis.call('HGET', driverKey, 'status')
if status ~= 'available' then
    return {0, 'driver_busy'}
end
redis.call('HSET', driverKey, 'status', 'matched')
redis.call('HSET', driverKey, 'currentRide', ARGV[1])
return {1, 'assigned'}
`;

// ─── Lua script: Atomically accept a ride (only one driver wins) ───
const ACCEPT_RIDE_LUA = `
local rideKey = 'ride:' .. ARGV[1]
local status = redis.call('HGET', rideKey, 'status')
if status ~= 'requested' and status ~= 'pending' then
    return {0, 'already_accepted'}
end
redis.call('HSET', rideKey, 'status', 'accepted')
redis.call('HSET', rideKey, 'driverId', ARGV[2])
redis.call('HSET', 'driver:' .. ARGV[2], 'status', 'busy')
return {1, 'accepted'}
`;

class RideMatchingService {
    constructor(io) {
        this.io = io;
    }

    /**
     * MATCH RIDE — Find nearest available driver using Redis GEO
     * Uses distributed lock to prevent double-assignment race conditions
     */
    async matchRide(rideRequest) {
        const { riderId, pickup, dropoff, vehicleType, price } = rideRequest;
        const lockKey = `lock:ride:matching:${riderId}`;

        // ── DISTRIBUTED LOCK ── prevent same rider from double-requesting
        const lockAcquired = await redis.set(lockKey, 'matching', 'NX', 'EX', 30);
        if (!lockAcquired) {
            throw new Error('Ride request already being processed');
        }

        try {
            // 1. Query drivers from Redis GEO index
            let nearbyDrivers = [];
            try {
                // Returns array of [ [driverId, distance], ... ]
                const geoResults = await redis.georadius(
                    'DriverLocations',
                    pickup.lng, pickup.lat,
                    50, 'km',
                    'WITHDIST', 'ASC'
                );

                for (const geo of geoResults) {
                    const driverId = typeof geo[0] === 'string' ? geo[0] : geo[0].toString();
                    const dist = geo[1];

                    const data = await redis.hgetall(`driver:${driverId}`);
                    if (data && data.status === 'available') {
                        nearbyDrivers.push([driverId, parseFloat(dist).toFixed(2)]);
                    }
                }
            } catch (redisErr) {
                console.log('[MATCH] Redis GEO driver lookup failed, falling back to DB:', redisErr.message);
            }

            // 2. Fallback: query from PostgreSQL if Redis has no drivers
            if (nearbyDrivers.length === 0) {
                return await this._matchFromDatabase(rideRequest);
            }

            // 3. Get rejected drivers for this ride (if re-matching)
            const rejectedDrivers = await redis.smembers(`ride:rejected:${riderId}`);

            // 4. Try to assign nearest available driver atomically
            for (const [driverId, distance] of nearbyDrivers) {
                if (rejectedDrivers.includes(driverId)) continue;

                // Atomic check-and-set via Lua script
                const result = await redis.eval(
                    ASSIGN_DRIVER_LUA, 1,
                    `driver:${driverId}`,
                    `pending-${riderId}`
                );

                if (result[0] === 1) {
                    // Driver assigned! Create ride in PostgreSQL
                    const ride = await this._createRide(rideRequest, driverId, distance);

                    // Store ride info in Redis for fast access
                    await redis.hmset(`ride:${ride.id}`, {
                        rideId: ride.id.toString(),
                        riderId: riderId.toString(),
                        driverId: driverId,
                        status: 'requested',
                        pickupLat: pickup.lat,
                        pickupLng: pickup.lng,
                        fare: price,
                    });
                    await redis.expire(`ride:${ride.id}`, 3600); // 1hr TTL

                    // Publish event
                    await EventBus.publish('ride:requested', {
                        rideId: ride.id,
                        riderId,
                        driverId,
                        pickup,
                        dropoff,
                        price,
                    });

                    // Notify specific driver via Socket.IO
                    this.io.to(String(driverId)).emit('newRideRequest', ride);
                    console.log(`[MATCH] Ride ${ride.id} → Driver ${driverId} (${distance}km)`);

                    return ride;
                }
            }
            throw new Error('All nearby drivers are busy');
        } finally {
            await redis.del(lockKey);
        }
    }

    /**
     * DRIVER ACCEPTS RIDE — atomic, only one driver wins
     * Other pending requests to this driver are re-queued
     */
    async driverAcceptRide(driverId, rideId) {
        // Atomic accept via Lua script
        const result = await redis.eval(ACCEPT_RIDE_LUA, 0, rideId, driverId);

        if (result[0] === 1) {
            // Update PostgreSQL
            await db.run(
                `UPDATE rides SET driver_id = $1, status = 'accepted' WHERE id = $2`,
                [driverId, rideId]
            );
            await db.run(
                `UPDATE drivers SET status = 'busy' WHERE user_id = $1`,
                [driverId]
            );

            const rideData = await redis.hgetall(`ride:${rideId}`);
            const riderId = rideData.riderId;

            // Notify ONLY the specific rider
            this.io.to(`rider:${riderId}`).emit('rideAccepted', {
                rideId, driverId, status: 'accepted'
            });
            // Also broadcast for backwards compat
            this.io.emit('rideAccepted', {
                rideId, driverId, status: 'accepted'
            });

            // Publish event for Payment/Notification services
            await EventBus.publish('ride:accepted', { rideId, driverId, riderId });

            // Clear other pending ride requests from this driver's queue
            await this._clearPendingRequests(driverId, rideId);

            console.log(`[MATCH] Driver ${driverId} accepted ride ${rideId}`);
            return { status: 'accepted', rideId, driverId };
        }

        return { status: 'failed', reason: result[1] };
    }

    /**
     * DRIVER REJECTS RIDE — find next nearest driver
     * Only the requesting rider gets the "searching" update
     */
    async driverRejectRide(driverId, rideId) {
        // Add to rejected set
        await redis.sadd(`ride:${rideId}:rejected`, driverId.toString());
        // Set driver back to available
        await redis.hset(`driver:${driverId}`, 'status', 'available');

        const rideData = await redis.hgetall(`ride:${rideId}`);
        const riderId = rideData.riderId;

        // Notify ONLY this specific rider
        this.io.to(`rider:${riderId}`).emit('rideUpdate', {
            rideId,
            status: 'searching',
            message: 'Finding another driver...'
        });

        // Re-match with next available driver
        console.log(`[MATCH] Driver ${driverId} rejected ride ${rideId}, re-matching...`);
        try {
            await this.matchRide({
                riderId: parseInt(riderId),
                pickup: { lat: parseFloat(rideData.pickupLat), lng: parseFloat(rideData.pickupLng) },
                dropoff: {},
                vehicleType: rideData.vehicleType || 'sedan',
                price: parseFloat(rideData.fare),
            });
        } catch (err) {
            this.io.to(`rider:${riderId}`).emit('noDriversAvailable', {
                rideId, message: 'No drivers available. Please try again.'
            });
        }
    }

    /**
     * COMPLETE RIDE — triggers payment processing via event bus
     */
    async completeRide(driverId, rideId) {
        await db.run(
            `UPDATE rides SET status = 'completed' WHERE id = $1 AND driver_id = $2`,
            [rideId, driverId]
        );
        await redis.hset(`ride:${rideId}`, 'status', 'completed');
        await redis.hset(`driver:${driverId}`, 'status', 'available');
        await db.run(`UPDATE drivers SET status = 'available' WHERE user_id = $1`, [driverId]);

        const rideData = await redis.hgetall(`ride:${rideId}`);

        // Publish completion event → Payment Service consumes this
        await EventBus.publish('ride:completed', {
            rideId,
            driverId,
            riderId: rideData.riderId,
            fare: rideData.fare,
        });

        this.io.emit('rideCompleted', { rideId, status: 'completed' });
        console.log(`[MATCH] Ride ${rideId} completed by driver ${driverId}`);
    }

    /**
     * UPDATE DRIVER LOCATION — stores in Redis GEO for spatial queries
     */
    async updateDriverLocation(driverId, lat, lng) {
        // Store location in Redis hash for metadata
        await redis.hmset(`driver:${driverId}`, {
            latitude: lat.toString(),
            longitude: lng.toString(),
            lastUpdate: Date.now().toString(),
        });

        // Add to Redis Geospatial index!
        await redis.geoadd('DriverLocations', lng, lat, driverId.toString());

        // Set driver as available if not currently busy
        const status = await redis.hget(`driver:${driverId}`, 'status');
        if (!status || status === 'offline') {
            await redis.hset(`driver:${driverId}`, 'status', 'available');
        }
    }

    /**
     * SURGE PRICING — demand/supply ratio per region
     */
    async calculateSurge(lat, lng) {
        const regionId = this._getRegionId(lat, lng);
        const activeRiders = parseInt(await redis.get(`region:${regionId}:riders`) || '0');
        const availableDrivers = parseInt(await redis.get(`region:${regionId}:drivers`) || '1');

        const ratio = activeRiders / Math.max(availableDrivers, 1);
        let multiplier = 1.0;
        if (ratio > 2.0) multiplier = 1.5;
        if (ratio > 3.0) multiplier = 2.0;
        if (ratio > 5.0) multiplier = 2.5;

        await redis.set(`surge:${regionId}`, multiplier.toString(), 'EX', 60);
        return multiplier;
    }

    // ─── Private helpers ───

    async _createRide(request, driverId, distance) {
        const { riderId, pickup, dropoff, vehicleType, price } = request;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO rides (rider_id, driver_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_address, dropoff_address, status, fare, vehicle_type)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10) RETURNING id`;
            db.run(sql, [
                riderId, driverId,
                pickup.lat, pickup.lng,
                dropoff?.lat || 0, dropoff?.lng || 0,
                pickup.address || '', dropoff?.address || '',
                price, vehicleType
            ], function (err) {
                if (err) return reject(err);
                resolve({
                    id: this.lastID,
                    riderId, driverId, pickup, dropoff,
                    vehicleType, price, status: 'pending',
                    distance: distance || '0',
                });
            });
        });
    }

    async _matchFromDatabase(rideRequest) {
        const { riderId, pickup, dropoff, vehicleType, price } = rideRequest;
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM drivers WHERE status = 'available' AND user_id != $1`,
                [riderId],
                async (err, drivers) => {
                    if (err) return reject(err);
                    if (!drivers || drivers.length === 0) {
                        return reject(new Error('No drivers available'));
                    }

                    // Sort by distance
                    drivers.sort((a, b) => {
                        const distA = calculateDistance(pickup.lat, pickup.lng, a.latitude, a.longitude);
                        const distB = calculateDistance(pickup.lat, pickup.lng, b.latitude, b.longitude);
                        return distA - distB;
                    });

                    const nearest = drivers[0];
                    const dist = calculateDistance(pickup.lat, pickup.lng, nearest.latitude, nearest.longitude);

                    try {
                        const ride = await this._createRide(rideRequest, nearest.user_id, dist.toFixed(1));
                        await EventBus.publish('ride:requested', {
                            rideId: ride.id, riderId, driverId: nearest.user_id
                        });
                        this.io.to(String(nearest.user_id)).emit('newRideRequest', ride);
                        resolve(ride);
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    }

    async _clearPendingRequests(driverId, acceptedRideId) {
        // Get all pending ride requests for this driver
        const pendingKeys = await redis.keys(`ride:pending:driver:${driverId}:*`);
        for (const key of pendingKeys) {
            const pendingRideId = key.split(':').pop();
            if (pendingRideId !== acceptedRideId.toString()) {
                // Re-match these rides with other drivers
                const rideData = await redis.hgetall(`ride:${pendingRideId}`);
                if (rideData && rideData.status === 'requested') {
                    await redis.sadd(`ride:${pendingRideId}:rejected`, driverId.toString());
                }
            }
            await redis.del(key);
        }
    }

    _getRegionId(lat, lng) {
        // Simple geo-hash: round to 1 decimal place (~11km grid)
        return `${Math.round(lat * 10) / 10}_${Math.round(lng * 10) / 10}`;
    }
}

module.exports = RideMatchingService;
