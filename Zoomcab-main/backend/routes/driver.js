const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');

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

    // Get available drivers (public or protected)
    router.get('/available', (req, res) => {
        const sql = `SELECT * FROM drivers WHERE status = 'available'`;
        db.all(sql, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    // Accept a ride
    router.post('/accept-ride/:id', authenticateToken, (req, res) => {
        const rideId = req.params.id;
        const driverId = req.user.id; // User ID from token, which is also driver ID if matched

        // Check if ride is still pending
        // Check if ride is still pending
        db.get(`SELECT status, rider_id FROM rides WHERE id = ?`, [rideId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Ride not found' });
            if (row.status !== 'pending') return res.status(400).json({ error: 'Ride already accepted' });

            const riderId = row.rider_id;

            // Update ride status
            const updateSql = `UPDATE rides SET driver_id = ?, status = 'accepted' WHERE id = ?`;

            db.run(updateSql, [driverId, rideId], function (err) {
                if (err) return res.status(500).json({ error: err.message });

                // Set driver status to busy
                db.run(`UPDATE drivers SET status = 'busy' WHERE user_id = ?`, [driverId]);

                // Notify rider
                const riderRoom = String(riderId);
                console.log(`[RIDE_ACCEPTED] Notifying rider in room: "${riderRoom}"`);
                io.to(riderRoom).emit('rideAccepted', { rideId, driverId, status: 'accepted' });

                // Debug broadcast
                io.emit('debug_msg', `Ride ${rideId} accepted by driver ${driverId}. Notifying rider ${riderId}.`);

                res.json({ message: 'Ride accepted', rideId, status: 'accepted' });
            });
        });
    });

    // Complete a ride
    router.post('/complete-ride/:id', authenticateToken, (req, res) => {
        const rideId = req.params.id;
        const driverId = req.user.id;

        const updateSql = `UPDATE rides SET status = 'completed' WHERE id = ? AND driver_id = ?`;
        db.run(updateSql, [rideId, driverId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(403).json({ error: 'Not authorized or ride not found' });

            // Set driver status to available
            db.run(`UPDATE drivers SET status = 'available' WHERE user_id = ?`, [driverId]);

            // Notify rider
            io.emit('rideCompleted', { rideId, status: 'completed' });

            res.json({ message: 'Ride completed', rideId, status: 'completed' });
        });
    });

    // Update driver location (API alternative to socket)
    router.post('/location', authenticateToken, (req, res) => {
        const { lat, lng } = req.body;
        const driverId = req.user.id;

        db.run(`INSERT OR REPLACE INTO drivers (user_id, latitude, longitude, status) VALUES (?, ?, ?, 'available')`,
            [driverId, lat, lng], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });

    return router;
};
