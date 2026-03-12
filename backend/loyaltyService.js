const db = require('./database');
const EventBus = require('./eventBus');

/**
 * LOYALTY SERVICE
 * - Tracks user loyalty points
 * - Awards points on ride completion
 * - Handles point redemption
 */
class LoyaltyService {
    constructor(io) {
        this.io = io;
        this.pointsPerCurrency = 10; // 10 points for every 1 currency unit
    }

    /**
     * Initialize listeners
     */
    init() {
        console.log('[LOYALTY] Service initialized');
        EventBus.subscribe('ride:completed', 'loyalty-group', 'loyalty-service', async (data) => {
            console.log(`[LOYALTY] Ride completed event received for ride: ${data.rideId}`);
            await this.awardPoints(data.riderId, data.fare);
        });
    }

    /**
     * Award points based on fare
     */
    async awardPoints(riderId, fare) {
        const points = Math.floor(fare * this.pointsPerCurrency);
        console.log(`[LOYALTY] Awarding ${points} points to rider ${riderId} for fare ${fare}`);

        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?`,
                [points, riderId],
                (err) => {
                    if (err) {
                        console.error('[LOYALTY] Error awarding points:', err);
                        return reject(err);
                    }
                    
                    // Notify rider of new points
                    this.io.to(`rider:${riderId}`).emit('pointsAwarded', {
                        points,
                        totalPoints: 'Check profile' // We could fetch and send, but simpler to just notify update
                    });
                    
                    resolve(points);
                }
            );
        });
    }

    /**
     * Get current points for a user
     */
    async getPoints(userId) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT loyalty_points FROM users WHERE id = ?`, [userId], (err, row) => {
                if (err) return reject(err);
                resolve(row ? row.loyalty_points : 0);
            });
        });
    }

    /**
     * Redeem points for a discount (e.g., 100 points = 1 unit)
     */
    async redeemPoints(userId, pointsToRedeem) {
        const currentPoints = await this.getPoints(userId);
        if (currentPoints < pointsToRedeem) {
            throw new Error('Insufficient points');
        }

        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ?`,
                [pointsToRedeem, userId],
                (err) => {
                    if (err) return reject(err);
                    resolve({ redeemed: pointsToRedeem, remaining: currentPoints - pointsToRedeem });
                }
            );
        });
    }
}

module.exports = LoyaltyService;
