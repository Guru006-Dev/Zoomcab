const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

module.exports = (matchingService) => {
    const router = express.Router();

    // Request a ride → matching service creates it and offers it to the nearest driver.
    router.post('/request-ride', authenticateToken, async (req, res) => {
        const { pickup, dropoff, vehicleType, price } = req.body || {};
        if (!pickup || typeof pickup.lat !== 'number' || typeof pickup.lng !== 'number') {
            return res.status(400).json({ error: 'pickup.lat and pickup.lng are required numbers' });
        }
        try {
            const ride = await matchingService.requestRide({
                riderId: req.user.id, pickup, dropoff, vehicleType, price,
            });
            res.status(201).json(ride);
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    // Check ride status (only the rider or the assigned driver may see it)
    router.get('/ride-status/:id', authenticateToken, (req, res) => {
        db.get(`SELECT * FROM rides WHERE id = ?`, [req.params.id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Ride not found' });
            if (row.rider_id !== req.user.id && row.driver_id !== req.user.id) return res.sendStatus(403);
            res.json(row);
        });
    });

    return router;
};
