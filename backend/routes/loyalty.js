const express = require('express');
const router = express.Router();

module.exports = (loyaltyService) => {
    // Get points for current user
    router.get('/points/:userId', async (req, res) => {
        try {
            const points = await loyaltyService.getPoints(req.params.userId);
            res.json({ userId: req.params.userId, points });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Redeem points
    router.post('/redeem', async (req, res) => {
        const { userId, points } = req.body;
        try {
            const result = await loyaltyService.redeemPoints(userId, points);
            res.json({ message: 'Points redeemed successfully', ...result });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    return router;
};
