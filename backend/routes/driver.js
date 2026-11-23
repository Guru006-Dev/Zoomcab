const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

module.exports = (matchingService) => {
    const router = express.Router();

    const requireDriver = (req, res, next) =>
        (req.user.role === 'driver' ? next() : res.status(403).json({ error: 'Drivers only' }));

    const send = (res) => (result) =>
        (result.ok ? res.json(result) : res.status(result.status || 400).json({ error: result.reason }));

    const fail = (res) => (err) => res.status(500).json({ error: err.message });

    router.get('/available', (req, res) => {
        db.all(`SELECT user_id, latitude, longitude, vehicle_type FROM drivers WHERE status = 'available'`, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    router.post('/accept-ride/:id', authenticateToken, requireDriver, (req, res) => {
        matchingService.acceptRide(req.user.id, req.params.id).then(send(res), fail(res));
    });

    router.post('/reject-ride/:id', authenticateToken, requireDriver, (req, res) => {
        matchingService.rejectRide(req.user.id, req.params.id).then(send(res), fail(res));
    });

    router.post('/complete-ride/:id', authenticateToken, requireDriver, (req, res) => {
        matchingService.completeRide(req.user.id, req.params.id).then(send(res), fail(res));
    });

    // Update driver location (REST alternative to the socket event)
    router.post('/location', authenticateToken, requireDriver, (req, res) => {
        const { lat, lng } = req.body || {};
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({ error: 'lat and lng must be numbers' });
        }
        matchingService.updateDriverLocation(req.user.id, lat, lng)
            .then(() => res.json({ success: true }), fail(res));
    });

    return router;
};
