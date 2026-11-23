const db = require('./db');
const EventBus = require('./eventBus');

/**
 * LOYALTY SERVICE
 * - Awards points when a ride completes (via the ride:completed event)
 * - Redeems points atomically, so two redemptions can't overspend
 */
class LoyaltyService {
    constructor(io) {
        this.io = io;
        this.pointsPerCurrency = 10; // 10 points for every 1 currency unit
    }

    init() {
        console.log('[LOYALTY] Service initialized');
        EventBus.subscribe('ride:completed', 'loyalty-group', 'loyalty-service', async (data) => {
            await this.awardPoints(data.riderId, data.fare);
        });
    }

    async awardPoints(riderId, fare) {
        const points = Math.floor(Number(fare || 0) * this.pointsPerCurrency);
        const row = await db.one(
            `UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2 RETURNING loyalty_points`,
            [points, riderId]
        );
        if (row) {
            this.io.to(`user:${riderId}`).emit('pointsAwarded', { points, totalPoints: row.loyalty_points });
        }
        return points;
    }

    async getPoints(userId) {
        const row = await db.one(`SELECT loyalty_points FROM users WHERE id = $1`, [userId]);
        return row ? row.loyalty_points : 0;
    }

    /** Spend points only if the balance covers it, in one statement. */
    async redeemPoints(userId, pointsToRedeem) {
        const points = Number(pointsToRedeem);
        if (!Number.isInteger(points) || points <= 0) throw new Error('points must be a positive integer');

        const row = await db.one(
            `UPDATE users SET loyalty_points = loyalty_points - $1
             WHERE id = $2 AND loyalty_points >= $1
             RETURNING loyalty_points`,
            [points, userId]
        );
        if (!row) throw new Error('Insufficient points');
        return { redeemed: points, remaining: row.loyalty_points };
    }
}

module.exports = LoyaltyService;
