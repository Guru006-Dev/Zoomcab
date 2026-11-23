/**
 * RIDE MATCHING SERVICE
 *
 * The single place where rides are requested, offered, accepted, rejected and completed.
 *
 * - Nearest-driver search with Redis GEO (falls back to a Haversine scan over SQLite when Redis is down)
 * - Per-rider distributed lock so a double-tap can't create two rides
 * - Atomic driver reservation (Redis Lua when available, conditional SQL UPDATE otherwise)
 * - Atomic acceptance: a conditional SQL UPDATE guarantees only one driver can win a ride,
 *   even across several backend instances sharing the database
 * - Notifications go only to the people involved (Socket.IO rooms), never to everyone
 */
const redis = require('./redisClient');
const dbAsync = require('./utils/dbAsync');
const { calculateDistance } = require('./utils/geo');
const EventBus = require('./eventBus');

const SEARCH_RADIUS_KM = parseFloat(process.env.MATCH_RADIUS_KM || '50');
const RIDE_TTL_SECONDS = 3600;

/** Room every user joins on connect (see server.js `join`). */
const userRoom = (userId) => `user:${userId}`;

// Atomically reserve a driver: only succeeds if the driver is still available.
const RESERVE_DRIVER_LUA = `
local status = redis.call('HGET', KEYS[1], 'status')
if status == false then
    return 2 -- Redis doesn't know this driver yet; SQLite decides
end
if status ~= 'available' then
    return 0
end
redis.call('HSET', KEYS[1], 'status', 'matched', 'currentRide', ARGV[1])
return 1
`;

class RideMatchingService {
    constructor(io) {
        this.io = io;
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Create a ride and offer it to the nearest available driver.
     * Returns the ride; `ride.offeredTo` is the driver id, or null if nobody was free.
     */
    async requestRide({ riderId, pickup, dropoff, vehicleType, price }) {
        const lockKey = `lock:ride:request:${riderId}`;
        const locked = await this._acquireLock(lockKey, 30);
        if (!locked) {
            const err = new Error('Ride request already being processed');
            err.status = 409;
            throw err;
        }

        try {
            const { lastID: rideId } = await dbAsync.run(
                `INSERT INTO rides (rider_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
                                    pickup_address, dropoff_address, status, fare, vehicle_type)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
                [riderId, pickup.lat, pickup.lng, dropoff?.lat ?? null, dropoff?.lng ?? null,
                    pickup.address || '', dropoff?.address || '', price, vehicleType]
            );

            const tripKm = dropoff?.lat != null
                ? calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)
                : 0;

            const ride = {
                id: rideId,
                riderId,
                pickup,
                dropoff,
                vehicleType,
                price,
                status: 'pending',
                distance: tripKm.toFixed(1),
                duration: Math.round(tripKm * 3), // rough: 3 min per km
                offeredTo: null,
            };

            await this._cacheRide(ride);
            await EventBus.publish('ride:requested', { rideId, riderId, pickup, dropoff, price });

            ride.offeredTo = await this._offerToNearestDriver(ride);
            return ride;
        } finally {
            await this._releaseLock(lockKey);
        }
    }

    /**
     * Driver accepts a ride. Exactly one driver can win: the UPDATE only matches
     * while the ride is still pending, and SQLite applies it atomically.
     */
    async acceptRide(driverId, rideId) {
        const ride = await dbAsync.get(`SELECT id, rider_id, status FROM rides WHERE id = ?`, [rideId]);
        if (!ride) return { ok: false, status: 404, reason: 'Ride not found' };

        const { changes } = await dbAsync.run(
            `UPDATE rides SET driver_id = ?, status = 'accepted' WHERE id = ? AND status = 'pending'`,
            [driverId, rideId]
        );
        if (changes === 0) return { ok: false, status: 409, reason: 'Ride already accepted' };

        await this._setDriverStatus(driverId, 'busy', rideId);
        await this._redisSafe(() => redis.hset(`ride:${rideId}`, 'status', 'accepted', 'driverId', String(driverId)));

        // Release any other driver this ride was offered to.
        const offeredTo = await this._redisSafe(() => redis.hget(`ride:${rideId}`, 'offeredTo'));
        if (offeredTo && String(offeredTo) !== String(driverId)) {
            await this._setDriverStatus(offeredTo, 'available');
            this.io.to(userRoom(offeredTo)).emit('rideOfferWithdrawn', { rideId });
        }

        const payload = { rideId: Number(rideId), driverId, status: 'accepted' };
        this.io.to(userRoom(ride.rider_id)).emit('rideAccepted', payload);
        await EventBus.publish('ride:accepted', { rideId, driverId, riderId: ride.rider_id });

        console.log(`[MATCH] Driver ${driverId} accepted ride ${rideId}`);
        return { ok: true, ...payload, riderId: ride.rider_id };
    }

    /** Driver declines an offer: free them up and offer the ride to the next nearest driver. */
    async rejectRide(driverId, rideId) {
        const ride = await this._loadRide(rideId);
        if (!ride || ride.status !== 'pending') return { ok: false, status: 409, reason: 'Ride is no longer pending' };

        await this._markRejected(rideId, driverId);
        await this._setDriverStatus(driverId, 'available');

        this.io.to(userRoom(ride.riderId)).emit('rideUpdate', {
            rideId: ride.id, status: 'searching', message: 'Finding another driver...',
        });

        const next = await this._offerToNearestDriver(ride);
        console.log(`[MATCH] Driver ${driverId} rejected ride ${rideId} → ${next ? `offered to ${next}` : 'no drivers left'}`);
        return { ok: true, offeredTo: next };
    }

    async completeRide(driverId, rideId) {
        const ride = await dbAsync.get(`SELECT rider_id, fare FROM rides WHERE id = ? AND driver_id = ?`, [rideId, driverId]);
        if (!ride) return { ok: false, status: 403, reason: 'Not authorized or ride not found' };

        await dbAsync.run(`UPDATE rides SET status = 'completed' WHERE id = ?`, [rideId]);
        await this._setDriverStatus(driverId, 'available');
        await this._redisSafe(() => redis.hset(`ride:${rideId}`, 'status', 'completed'));

        this.io.to(userRoom(ride.rider_id)).emit('rideCompleted', { rideId: Number(rideId), status: 'completed' });
        await EventBus.publish('ride:completed', { rideId, driverId, riderId: ride.rider_id, fare: ride.fare });

        console.log(`[MATCH] Ride ${rideId} completed by driver ${driverId}`);
        return { ok: true, rideId: Number(rideId), status: 'completed' };
    }

    /**
     * Store a driver's position (Redis GEO + SQLite) and forward it to the rider
     * of the driver's active ride, if any. Never broadcast to everyone.
     */
    async updateDriverLocation(driverId, lat, lng) {
        const existing = await dbAsync.get(`SELECT status FROM drivers WHERE user_id = ?`, [driverId]);
        const status = existing && existing.status !== 'offline' ? existing.status : 'available';

        await dbAsync.run(
            `INSERT INTO drivers (user_id, latitude, longitude, status) VALUES (?, ?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET latitude = excluded.latitude, longitude = excluded.longitude, status = ?`,
            [driverId, lat, lng, status, status]
        );

        await this._redisSafe(async () => {
            await redis.geoadd('DriverLocations', lng, lat, String(driverId));
            await redis.hset(`driver:${driverId}`, 'latitude', String(lat), 'longitude', String(lng),
                'lastUpdate', String(Date.now()));
            await redis.hsetnx(`driver:${driverId}`, 'status', status);
        });

        const active = await dbAsync.get(
            `SELECT rider_id FROM rides WHERE driver_id = ? AND status = 'accepted' ORDER BY id DESC LIMIT 1`,
            [driverId]
        );
        if (active) {
            this.io.to(userRoom(active.rider_id)).emit('driverLocationUpdate', { driverId, lat, lng });
        }
    }

    /** Surge multiplier from demand/supply in a ~11 km grid cell. */
    async calculateSurge(lat, lng) {
        const regionId = this._regionId(lat, lng);
        const multiplier = await this._redisSafe(async () => {
            const riders = parseInt((await redis.get(`region:${regionId}:riders`)) || '0', 10);
            const drivers = parseInt((await redis.get(`region:${regionId}:drivers`)) || '1', 10);
            const ratio = riders / Math.max(drivers, 1);
            let m = 1.0;
            if (ratio > 2.0) m = 1.5;
            if (ratio > 3.0) m = 2.0;
            if (ratio > 5.0) m = 2.5;
            await redis.set(`surge:${regionId}`, String(m), 'EX', 60);
            return m;
        });
        return multiplier ?? 1.0;
    }

    // ─── Matching internals ──────────────────────────────────────────────────

    /** Offer the ride to the nearest free driver who hasn't rejected it. Returns that driver id or null. */
    async _offerToNearestDriver(ride) {
        const rejected = new Set(await this._rejectedDrivers(ride.id));
        const candidates = await this._nearbyDrivers(ride.pickup, ride.riderId);

        for (const { driverId, distanceKm } of candidates) {
            if (rejected.has(String(driverId))) continue;
            if (!(await this._reserveDriver(driverId, ride.id))) continue; // someone else got them

            await this._redisSafe(() => redis.hset(`ride:${ride.id}`, 'offeredTo', String(driverId)));
            this.io.to(userRoom(driverId)).emit('newRideRequest', { ...ride, offeredTo: driverId, driverDistance: distanceKm });
            console.log(`[MATCH] Ride ${ride.id} offered to driver ${driverId} (${distanceKm.toFixed(2)} km)`);
            return driverId;
        }

        this.io.to(userRoom(ride.riderId)).emit('noDriversAvailable', {
            rideId: ride.id, message: 'No drivers available nearby. Please try again.',
        });
        return null;
    }

    /** Available drivers sorted by distance from pickup. Redis GEO first, SQLite scan as fallback. */
    async _nearbyDrivers(pickup, riderId) {
        const fromRedis = await this._redisSafe(async () => {
            const results = await redis.georadius('DriverLocations', pickup.lng, pickup.lat,
                SEARCH_RADIUS_KM, 'km', 'WITHDIST', 'ASC');
            const out = [];
            for (const [id, dist] of results) {
                if (String(id) === String(riderId)) continue;
                const status = await redis.hget(`driver:${id}`, 'status');
                if (status === 'available') out.push({ driverId: Number(id), distanceKm: parseFloat(dist) });
            }
            return out;
        });
        if (fromRedis && fromRedis.length > 0) return fromRedis;

        const rows = await dbAsync.all(
            `SELECT user_id, latitude, longitude FROM drivers
             WHERE status = 'available' AND user_id != ? AND latitude IS NOT NULL`,
            [riderId]
        );
        return rows
            .map((d) => ({ driverId: d.user_id, distanceKm: calculateDistance(pickup.lat, pickup.lng, d.latitude, d.longitude) }))
            .filter((d) => d.distanceKm <= SEARCH_RADIUS_KM)
            .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    /** Atomically move a driver from available → matched. Redis and SQLite must both agree. */
    async _reserveDriver(driverId, rideId) {
        const redisResult = await this._redisSafe(() =>
            redis.eval(RESERVE_DRIVER_LUA, 1, `driver:${driverId}`, String(rideId)));
        if (redisResult === 0) return false;

        const { changes } = await dbAsync.run(
            `UPDATE drivers SET status = 'matched' WHERE user_id = ? AND status = 'available'`,
            [driverId]
        );
        if (changes === 0) {
            // SQLite says they're taken; make Redis agree.
            if (redisResult === 1) await this._redisSafe(() => redis.hset(`driver:${driverId}`, 'status', 'busy'));
            return false;
        }
        if (redisResult === 2) {
            await this._redisSafe(() => redis.hset(`driver:${driverId}`, 'status', 'matched', 'currentRide', String(rideId)));
        }
        return true;
    }

    async _setDriverStatus(driverId, status, rideId = null) {
        await dbAsync.run(`UPDATE drivers SET status = ? WHERE user_id = ?`, [status, driverId]);
        await this._redisSafe(() => (rideId
            ? redis.hset(`driver:${driverId}`, 'status', status, 'currentRide', String(rideId))
            : redis.hset(`driver:${driverId}`, 'status', status)));
    }

    // ─── Ride state helpers ─────────────────────────────────────────────────

    async _cacheRide(ride) {
        await this._redisSafe(async () => {
            await redis.hset(`ride:${ride.id}`, {
                rideId: String(ride.id),
                riderId: String(ride.riderId),
                status: ride.status,
                pickupLat: String(ride.pickup.lat),
                pickupLng: String(ride.pickup.lng),
                fare: String(ride.price ?? ''),
                vehicleType: ride.vehicleType || '',
            });
            await redis.expire(`ride:${ride.id}`, RIDE_TTL_SECONDS);
        });
    }

    async _loadRide(rideId) {
        const row = await dbAsync.get(`SELECT * FROM rides WHERE id = ?`, [rideId]);
        if (!row) return null;
        return {
            id: row.id,
            riderId: row.rider_id,
            status: row.status,
            pickup: { lat: row.pickup_lat, lng: row.pickup_lng, address: row.pickup_address },
            dropoff: { lat: row.dropoff_lat, lng: row.dropoff_lng, address: row.dropoff_address },
            vehicleType: row.vehicle_type,
            price: row.fare,
        };
    }

    // Rejections live in Redis when available, otherwise in memory (single-instance only).
    async _markRejected(rideId, driverId) {
        const ok = await this._redisSafe(async () => {
            await redis.sadd(`ride:${rideId}:rejected`, String(driverId));
            await redis.expire(`ride:${rideId}:rejected`, RIDE_TTL_SECONDS);
            return true;
        });
        if (!ok) {
            this._localRejected = this._localRejected || new Map();
            const key = String(rideId);
            if (!this._localRejected.has(key)) this._localRejected.set(key, new Set());
            this._localRejected.get(key).add(String(driverId));
        }
    }

    async _rejectedDrivers(rideId) {
        const fromRedis = await this._redisSafe(() => redis.smembers(`ride:${rideId}:rejected`));
        const local = this._localRejected?.get(String(rideId)) || new Set();
        return [...(fromRedis || []), ...local];
    }

    // ─── Infrastructure helpers ─────────────────────────────────────────────

    /** Run a Redis operation; return null instead of throwing if Redis is down. */
    async _redisSafe(fn) {
        if (!redis.isReady()) return null;
        try {
            return await fn();
        } catch (err) {
            console.warn('[MATCH] Redis operation failed, continuing without it:', err.message);
            return null;
        }
    }

    async _acquireLock(key, ttlSeconds) {
        if (!redis.isReady()) {
            // Single-instance fallback lock.
            this._localLocks = this._localLocks || new Set();
            if (this._localLocks.has(key)) return false;
            this._localLocks.add(key);
            return true;
        }
        return (await redis.set(key, '1', 'EX', ttlSeconds, 'NX')) === 'OK';
    }

    async _releaseLock(key) {
        this._localLocks?.delete(key);
        await this._redisSafe(() => redis.del(key));
    }

    _regionId(lat, lng) {
        return `${Math.round(lat * 10) / 10}_${Math.round(lng * 10) / 10}`;
    }
}

RideMatchingService.userRoom = userRoom;
module.exports = RideMatchingService;
