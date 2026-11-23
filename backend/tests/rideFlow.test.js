const { startServer, stopServer, api, createUser, eventually, sleep } = require('./helpers');

// Pickup at Amrita University, Coimbatore; drivers are placed relative to it.
const PICKUP = { lat: 10.9027, lng: 76.9006, address: 'Amrita University' };
const DROPOFF = { lat: 10.99, lng: 76.96, address: 'Gandhipuram' };
const FAR_AWAY = { lat: 0, lng: 0 }; // outside the 50 km search radius

const requestRide = (rider) =>
    api('POST', '/rider/request-ride', { pickup: PICKUP, dropoff: DROPOFF, vehicleType: 'sedan', price: 200 }, rider.token);

const placeDriver = async (driver, { lat, lng }) => {
    const res = await api('POST', '/driver/location', { lat, lng }, driver.token);
    expect(res.status).toBe(200);
};

let redisUp;
beforeAll(async () => { ({ redisUp } = await startServer()); });
afterAll(stopServer);

describe('ride flow', () => {
    let rider, near, far, bystander;

    // Fresh actors per test so state never leaks between tests.
    beforeEach(async () => {
        rider = await createUser('rider');
        near = await createUser('driver');
        far = await createUser('driver');
        bystander = await createUser('rider');
        await placeDriver(near, { lat: PICKUP.lat + 0.0005, lng: PICKUP.lng + 0.0005 });
        await placeDriver(far, { lat: PICKUP.lat + 0.05, lng: PICKUP.lng + 0.05 });
    });

    // Move this test's drivers out of range so they can't be matched by later tests.
    afterEach(async () => {
        await placeDriver(near, FAR_AWAY);
        await placeDriver(far, FAR_AWAY);
    });

    test('offers the ride only to the nearest driver', async () => {
        const res = await requestRide(rider);
        expect(res.status).toBe(201);
        expect(res.body.offeredTo).toBe(near.id);

        expect(await eventually(() => near.received('newRideRequest').length === 1)).toBe(true);
        await sleep(200);
        expect(far.received('newRideRequest')).toHaveLength(0);
    });

    test('a declined ride is offered to the next nearest driver', async () => {
        const { body: ride } = await requestRide(rider);
        const rej = await api('POST', `/driver/reject-ride/${ride.id}`, null, near.token);

        expect(rej.status).toBe(200);
        expect(rej.body.offeredTo).toBe(far.id);
        expect(await eventually(() => far.received('newRideRequest').length === 1)).toBe(true);
        expect(await eventually(() => rider.received('rideUpdate').some((u) => u.status === 'searching'))).toBe(true);
    });

    test('simultaneous accepts: exactly one driver wins', async () => {
        const { body: ride } = await requestRide(rider);
        const results = await Promise.all([
            api('POST', `/driver/accept-ride/${ride.id}`, null, near.token),
            api('POST', `/driver/accept-ride/${ride.id}`, null, far.token),
        ]);

        expect(results.map((r) => r.status).sort()).toEqual([200, 409]);

        const winner = results[0].status === 200 ? near : far;
        expect(await eventually(() => rider.received('rideAccepted').some((a) => a.driverId === winner.id))).toBe(true);
        expect(rider.received('rideAccepted')).toHaveLength(1);
    });

    test('only the rider of the active ride sees the driver move', async () => {
        const { body: ride } = await requestRide(rider);
        await api('POST', `/driver/accept-ride/${ride.id}`, null, near.token);

        near.socket.emit('updateLocation', { lat: 10.91, lng: 76.91 });
        expect(await eventually(() => rider.received('driverLocationUpdate').length > 0)).toBe(true);
        expect(rider.received('driverLocationUpdate')[0]).toMatchObject({ driverId: near.id, lat: 10.91, lng: 76.91 });

        await sleep(200);
        for (const name of ['driverLocationUpdate', 'rideAccepted', 'newRideRequest']) {
            expect(bystander.received(name)).toHaveLength(0);
        }
    });

    test('completing a ride notifies the rider and frees the driver', async () => {
        const { body: ride } = await requestRide(rider);
        await api('POST', `/driver/accept-ride/${ride.id}`, null, near.token);

        const done = await api('POST', `/driver/complete-ride/${ride.id}`, null, near.token);
        expect(done.status).toBe(200);
        expect(await eventually(() => rider.received('rideCompleted').length === 1)).toBe(true);

        const available = await api('GET', '/driver/available');
        expect(available.body.map((d) => d.user_id)).toContain(near.id);
    });

    test('loyalty points are awarded on completion and redeemed atomically', async () => {
        const { body: ride } = await requestRide(rider);
        await api('POST', `/driver/accept-ride/${ride.id}`, null, near.token);
        await api('POST', `/driver/complete-ride/${ride.id}`, null, near.token);

        // The loyalty service listens on the Redis event bus; without Redis there is no event.
        if (!redisUp) return;
        expect(await eventually(async () =>
            (await api('GET', '/loyalty/points', null, rider.token)).body.points === 2000)).toBe(true);

        // Two concurrent redemptions of 1500 from 2000: only one can succeed.
        const results = await Promise.all([
            api('POST', '/loyalty/redeem', { points: 1500 }, rider.token),
            api('POST', '/loyalty/redeem', { points: 1500 }, rider.token),
        ]);
        expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
        expect((await api('GET', '/loyalty/points', null, rider.token)).body.points).toBe(500);
    });

    test('riders can review a completed ride once, and only their own', async () => {
        const { body: ride } = await requestRide(rider);
        await api('POST', `/driver/accept-ride/${ride.id}`, null, near.token);

        // Not completed yet
        expect((await api('POST', '/rating/submit', { rideId: ride.id, rating: 5 }, rider.token)).status).toBe(403);
        await api('POST', `/driver/complete-ride/${ride.id}`, null, near.token);

        expect((await api('POST', '/rating/submit', { rideId: ride.id, rating: 5 }, bystander.token)).status).toBe(403);
        expect((await api('POST', '/rating/submit', { rideId: ride.id, rating: 9 }, rider.token)).status).toBe(400);

        const ok = await api('POST', '/rating/submit', { rideId: ride.id, rating: 4, comment: 'Smooth' }, rider.token);
        expect(ok.status).toBe(201);
        expect(ok.body.review.driverId).toBe(near.id);
        expect((await api('POST', '/rating/submit', { rideId: ride.id, rating: 5 }, rider.token)).status).toBe(409);

        const stats = await api('GET', `/rating/driver/${near.id}`);
        expect(stats.body.stats).toMatchObject({ averageRating: 4, totalReviews: 1 });
    });

    test('only the assigned driver can complete a ride', async () => {
        const { body: ride } = await requestRide(rider);
        await api('POST', `/driver/accept-ride/${ride.id}`, null, near.token);
        expect((await api('POST', `/driver/complete-ride/${ride.id}`, null, far.token)).status).toBe(403);
    });

    test('no drivers nearby: rider is told straight away', async () => {
        await placeDriver(near, FAR_AWAY);
        await placeDriver(far, FAR_AWAY);

        const res = await requestRide(rider);
        expect(res.status).toBe(201);
        expect(res.body.offeredTo).toBeNull();
        expect(await eventually(() => rider.received('noDriversAvailable').length === 1)).toBe(true);
    });
});

describe('auth and access control', () => {
    test('ride endpoints require a token', async () => {
        expect((await api('POST', '/rider/request-ride', { pickup: PICKUP })).status).toBe(401);
        expect((await api('POST', '/driver/accept-ride/1')).status).toBe(401);
    });

    test('riders cannot use driver endpoints', async () => {
        const rider = await createUser('rider');
        expect((await api('POST', '/driver/accept-ride/1', null, rider.token)).status).toBe(403);
    });

    test('a driver cannot send location updates as someone else', async () => {
        const rider = await createUser('rider');
        const driver = await createUser('driver');
        const impostor = await createUser('driver');
        await placeDriver(driver, { lat: PICKUP.lat + 0.0001, lng: PICKUP.lng + 0.0001 });
        await placeDriver(impostor, FAR_AWAY);

        const { body: ride } = await requestRide(rider);
        expect(ride.offeredTo).toBe(driver.id);
        await api('POST', `/driver/accept-ride/${ride.id}`, null, driver.token);

        // The payload claims to be the real driver; the server must ignore that.
        impostor.socket.emit('updateLocation', { driverId: driver.id, lat: 1, lng: 1 });
        await sleep(300);
        expect(rider.received('driverLocationUpdate')).toHaveLength(0);

        await placeDriver(driver, FAR_AWAY);
    });

    test("a user cannot read someone else's ride", async () => {
        const owner = await createUser('rider');
        const other = await createUser('rider');
        const { body: ride } = await requestRide(owner);
        expect((await api('GET', `/rider/ride-status/${ride.id}`, null, other.token)).status).toBe(403);
        expect((await api('GET', `/rider/ride-status/${ride.id}`, null, owner.token)).status).toBe(200);
    });

    test('loyalty and rating writes require a login', async () => {
        expect((await api('POST', '/loyalty/redeem', { points: 1 })).status).toBe(401);
        expect((await api('GET', '/loyalty/points')).status).toBe(401);
        expect((await api('POST', '/rating/submit', { rideId: 1, rating: 5 })).status).toBe(401);
    });

    test('non-numeric ride ids are a 404, not a server error', async () => {
        const driver = await createUser('driver');
        expect((await api('POST', '/driver/accept-ride/demo_123', null, driver.token)).status).toBe(404);
        expect((await api('GET', '/rider/ride-status/abc', null, driver.token)).status).toBe(404);
    });

    test('usernames are unique', async () => {
        const name = `dup${Date.now()}`;
        expect((await api('POST', '/auth/register', { username: name, password: 'pw123456', role: 'rider' })).status).toBe(201);
        expect((await api('POST', '/auth/register', { username: name, password: 'pw123456', role: 'rider' })).status).toBe(409);
    });

    test('request-ride validates the pickup', async () => {
        const rider = await createUser('rider');
        expect((await api('POST', '/rider/request-ride', { pickup: { lat: 'x' } }, rider.token)).status).toBe(400);
    });
});

describe('health endpoint', () => {
    test('reports instance and Redis status', async () => {
        const res = await api('GET', '/health');
        expect(res.status).toBe(200);
        expect(res.body.redis).toBe(redisUp ? 'connected' : 'unavailable');
        expect(res.headers.get('x-served-by')).toBe(res.body.instanceId);
    });
});
