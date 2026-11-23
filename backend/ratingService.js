const db = require('./db');

/**
 * RATING & REVIEWS SERVICE
 * Riders review the driver of a completed ride they took, once per ride.
 */
class RatingService {
    async submitReview({ rideId, riderId, rating, comment }) {
        const stars = Number(rating);
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
            throw Object.assign(new Error('Rating must be an integer between 1 and 5'), { status: 400 });
        }

        // The driver comes from the ride itself, and the ride must be this rider's and finished.
        const ride = await db.one(
            `SELECT driver_id FROM rides WHERE id = $1 AND rider_id = $2 AND status = 'completed'`,
            [Number(rideId) || 0, riderId]
        );
        if (!ride) {
            throw Object.assign(new Error('You can only review your own completed rides'), { status: 403 });
        }

        try {
            return await db.one(
                `INSERT INTO reviews (ride_id, rider_id, driver_id, rating, comment)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, ride_id AS "rideId", driver_id AS "driverId", rating, comment`,
                [rideId, riderId, ride.driver_id, stars, comment || null]
            );
        } catch (err) {
            if (err.code === '23505') throw Object.assign(new Error('Ride already reviewed'), { status: 409 });
            throw err;
        }
    }

    async getDriverRating(driverId) {
        const row = await db.one(
            `SELECT AVG(rating) AS avg_rating, COUNT(id) AS review_count FROM reviews WHERE driver_id = $1`,
            [driverId]
        );
        return {
            driverId: Number(driverId),
            averageRating: row.avg_rating ? Number(row.avg_rating.toFixed(1)) : 0,
            totalReviews: row.review_count,
        };
    }

    async getRecentReviews(driverId, limit = 5) {
        return db.many(
            `SELECT r.rating, r.comment, r.created_at, u.username AS "riderName"
             FROM reviews r JOIN users u ON r.rider_id = u.id
             WHERE r.driver_id = $1
             ORDER BY r.created_at DESC LIMIT $2`,
            [driverId, limit]
        );
    }
}

module.exports = RatingService;
