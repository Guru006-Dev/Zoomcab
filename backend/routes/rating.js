const express = require('express');
const { authenticateToken } = require('../middleware/auth');

module.exports = (ratingService) => {
    const router = express.Router();

    // A rider reviews the driver of one of their completed rides.
    router.post('/submit', authenticateToken, async (req, res) => {
        const { rideId, rating, comment } = req.body || {};
        try {
            const review = await ratingService.submitReview({ rideId, riderId: req.user.id, rating, comment });
            res.status(201).json({ message: 'Review submitted successfully', review });
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    // Public driver rating summary
    router.get('/driver/:driverId', async (req, res) => {
        if (!/^\d+$/.test(req.params.driverId)) return res.status(404).json({ error: 'Driver not found' });
        try {
            const stats = await ratingService.getDriverRating(req.params.driverId);
            const recentReviews = await ratingService.getRecentReviews(req.params.driverId);
            res.json({ stats, recentReviews });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
