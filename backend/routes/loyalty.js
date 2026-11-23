const express = require('express');
const { authenticateToken } = require('../middleware/auth');

module.exports = (loyaltyService) => {
    const router = express.Router();

    // Points for the logged-in user
    router.get('/points', authenticateToken, async (req, res) => {
        try {
            res.json({ userId: req.user.id, points: await loyaltyService.getPoints(req.user.id) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Redeem the logged-in user's points
    router.post('/redeem', authenticateToken, async (req, res) => {
        try {
            const result = await loyaltyService.redeemPoints(req.user.id, req.body?.points);
            res.json({ message: 'Points redeemed successfully', ...result });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    return router;
};
