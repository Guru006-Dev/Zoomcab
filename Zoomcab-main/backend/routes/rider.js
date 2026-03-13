const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');
const { calculateDistance } = require('../utils/geo');

module.exports = (io) => {
    // Middleware to protect routes
    const authenticateToken = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.sendStatus(401);

        jwt.verify(token, 'secret-key-12345', (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    };

    // Request a ride - Updates to use Euclidean Distance
    router.post('/request-ride', authenticateToken, (req, res) => {
        const { pickup, dropoff, vehicleType, price } = req.body;
        const riderId = req.user.id;
        const pickupLat = pickup.lat;
        const pickupLng = pickup.lng;

        // 1. Create Ride Record
        const sql = `INSERT INTO rides (rider_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_address, dropoff_address, status, fare, vehicle_type) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`;
        const params = [
            riderId,
            pickup.lat, pickup.lng,
            dropoff.lat, dropoff.lng,
            pickup.address, dropoff.address,
            price,
            vehicleType
        ];

        db.run(sql, params, function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const rideId = this.lastID;

            // Calculate distance for ride info
            const tripDistance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
            const durationMin = Math.round(tripDistance * 3); // Rough estimate: 3 mins per km

            const rideData = {
                id: rideId,
                riderId,
                pickup,
                dropoff,
                vehicleType,
                price,
                status: 'pending',
                distance: tripDistance.toFixed(1),
                duration: durationMin
            };

            // 2. Resource Discovery: Find Nearest Driver
            const driverSql = `SELECT * FROM drivers WHERE status = 'available' AND user_id != ?`;
            db.all(driverSql, [riderId], (err, drivers) => {
                if (err) {
                    console.error("Error fetching drivers:", err);
                    return; // Fail silently for this async part
                }

                console.log(`[RIDE_REQUEST] Found ${drivers.length} available drivers.`);
                drivers.forEach(d => console.log(` - Driver ${d.user_id} at ${d.latitude}, ${d.longitude}`));

                if (drivers.length === 0) {
                    console.log("[RIDE_REQUEST] No drivers available in DB.");
                    // Optionally notify rider immediately
                    io.to(riderId).emit('noDriversAvailable');
                    // ALSO emit globally for debugging frontend if riderId implementation is tricky
                    io.emit('debug_msg', 'No drivers found via backend');
                    return;
                }

                // calculating Euclidean Distance (actually Haversine for geo)
                let nearestDriver = null;
                let minDistance = Infinity;

                drivers.forEach(driver => {
                    const dist = calculateDistance(pickupLat, pickupLng, driver.latitude, driver.longitude);
                    console.log(` - Distance to Driver ${driver.user_id}: ${dist} km`);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestDriver = driver;
                    }
                });

                if (nearestDriver && minDistance < 5000) { // INCREASED RANGE FOR TESTING (5000km)
                    console.log(`[RIDE_REQUEST] Assigning ride ${rideId} to driver ${nearestDriver.user_id} (Distance: ${minDistance.toFixed(2)}km)`);

                    // 3. Mutual Exclusion & Assignment
                    // Send to SPECIFIC driver
                    const driverRoom = String(nearestDriver.user_id);
                    console.log(`[RIDE_REQUEST] Emitting to room: "${driverRoom}"`);
                    io.to(driverRoom).emit('newRideRequest', rideData);

                    // Emit debug info to everyone to help troubleshoot
                    io.emit('debug_msg', `Server assigned ride ${rideId} to room "${driverRoom}"`);
                } else {
                    console.log("[RIDE_REQUEST] No drivers within range.");
                    io.to(riderId).emit('noDriversAvailable');
                }
            });

            res.status(201).json(rideData);
        });
    });

    // Check ride status
    router.get('/ride-status/:id', authenticateToken, (req, res) => {
        const rideId = req.params.id;
        db.get(`SELECT * FROM rides WHERE id = ?`, [rideId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Ride not found' });
            res.json(row);
        });
    });

    return router;
};
