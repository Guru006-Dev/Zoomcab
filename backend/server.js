const config = require('./config');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const riderRoutes = require('./routes/rider');
const driverRoutes = require('./routes/driver');
const chatbotRoutes = require('./chatbot/chatbotRoutes');
const dbAsync = require('./utils/dbAsync');
const redis = require('./redisClient');
const LoyaltyService = require('./loyaltyService');
const loyaltyRoutes = require('./routes/loyalty');
const RatingService = require('./ratingService');
const ratingRoutes = require('./routes/rating');
const RideMatchingService = require('./rideMatchingService');
const LeaderElection = require('./leaderElection');
const ServiceRegistry = require('./serviceRegistry');
const { createAdapter } = require('@socket.io/redis-adapter');

const { userRoom } = RideMatchingService;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: config.corsOrigin }));
// Lets you see which instance served a request when running behind the load balancer.
app.use((req, res, next) => { res.set('X-Served-By', config.instanceId); next(); });
app.use(bodyParser.json());

// Initialize Services
const matchingService = new RideMatchingService(io);
const loyaltyService = new LoyaltyService(io);
loyaltyService.init();
const ratingService = new RatingService();
const leader = new LeaderElection(config.instanceId, 'ride-matching');
const registry = new ServiceRegistry('api', require('os').hostname(), config.port);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rider', riderRoutes(matchingService));
app.use('/api/driver', driverRoutes(matchingService));
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/loyalty', loyaltyRoutes(loyaltyService));
app.use('/api/rating', ratingRoutes(ratingService));

// Which instance answered, who leads the cluster, and whether Redis is up.
app.get('/api/health', (req, res) => {
    res.json({
        instanceId: config.instanceId,
        redis: redis.isReady() ? 'connected' : 'unavailable',
        leader: leader.leaderId,
        isLeader: leader.isLeader,
        demoMode: config.demoMode,
    });
});

// Middleware for errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

server.listen(config.port, () => {
    console.log(`Server ${config.instanceId} is running on port ${config.port}`);
});

// Cluster membership needs Redis. Join once it's reachable; run fine without it.
let clusterStarted = false;
redis.on('ready', async () => {
    if (clusterStarted) return;
    clusterStarted = true;
    try {
        // Redis adapter: an emit to `user:42` on this instance reaches user 42's socket
        // even when it is connected to another instance.
        const pubClient = redis.duplicate({ enableOfflineQueue: true });
        const subClient = redis.duplicate({ enableOfflineQueue: true });
        pubClient.on('error', () => { });
        subClient.on('error', () => { });
        io.adapter(createAdapter(pubClient, subClient));
        console.log('[CLUSTER] Socket.IO Redis adapter attached');

        await registry.register();
        await leader.start();
    } catch (err) {
        clusterStarted = false;
        console.warn('[CLUSTER] Could not join cluster:', err.message);
    }
});

const shutdown = async () => {
    try { await Promise.all([leader.stop(), registry.deregister()]); } catch (e) { /* Redis may be gone */ }
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Socket.IO Handling
// Every authenticated socket joins exactly one room: `user:<id>`. All ride events are
// sent to those rooms, so riders and drivers only ever see their own rides.
io.on('connection', (socket) => {
    const authenticate = (token) => {
        try {
            socket.data.user = jwt.verify(token, config.jwtSecret);
            socket.join(userRoom(socket.data.user.id));
            return true;
        } catch (e) {
            return false;
        }
    };

    if (socket.handshake.auth?.token) authenticate(socket.handshake.auth.token);

    socket.on('join', (data = {}) => {
        if (!authenticate(data.token)) {
            socket.emit('authError', { message: 'Invalid or missing token' });
        }
    });

    // Driver location: identity comes from the verified token, never from the payload.
    socket.on('updateLocation', async (data = {}) => {
        const user = socket.data.user;
        if (!user || user.role !== 'driver') return;
        if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
        try {
            await matchingService.updateDriverLocation(user.id, data.lat, data.lng);
        } catch (err) {
            console.error('[SOCKET] updateLocation failed:', err.message);
        }
    });

    // Rider tells their driver payment went through.
    socket.on('payment_completed_broadcast', async (data = {}) => {
        const user = socket.data.user;
        if (!user || !data.rideId) return;
        const ride = await dbAsync.get(`SELECT rider_id, driver_id FROM rides WHERE id = ?`, [data.rideId]).catch(() => null);
        if (ride && ride.rider_id === user.id && ride.driver_id) {
            io.to(userRoom(ride.driver_id)).emit('paymentCompleted', { rideId: data.rideId });
        }
    });

    // DEMO MODE: lets one person test the rider flow with no driver online.
    // If the ride is still pending after a few seconds, a simulated driver accepts it
    // and drives toward the pickup. Only the requesting rider sees any of it.
    socket.on('ride_requested_broadcast', (data = {}) => {
        if (!config.demoMode) return;
        const rideId = data.ride?.id;
        const target = socket.data.user ? io.to(userRoom(socket.data.user.id)) : socket;

        setTimeout(async () => {
            if (rideId) {
                const ride = await dbAsync.get(`SELECT status FROM rides WHERE id = ?`, [rideId]).catch(() => null);
                if (!ride || ride.status !== 'pending') return; // a real driver got it
            }
            const driverId = 'demo-driver';
            console.log(`[DEMO] Simulated driver accepting ride ${rideId ?? '(offline mock)'}`);
            target.emit('rideAccepted', { rideId: rideId ?? `mock-${Date.now()}`, driverId, status: 'accepted', demo: true });
            simulateDriverDrive(target, driverId);
        }, 3500);
    });

    // AI Chatbot Auto-Replies
    socket.on('chatMessage', (data) => {
        console.log(`[CHAT] Rider says: ${data.text}`);

        let reply = "I'm on my way! Should be there shortly.";
        const lowerText = data.text.toLowerCase();

        if (lowerText.includes('where') || lowerText.includes('how long')) {
            reply = "I'm currently navigating through traffic on the main road. I estimate I'll be there in about 4 minutes!";
        } else if (lowerText.includes('cancel') || lowerText.includes('wrong')) {
            reply = "Oh no, do you need me to stop? Just cancel in the app if you have changed your mind.";
        } else if (lowerText.includes('gate') || lowerText.includes('entrance')) {
            reply = "Got it! I will pull up exactly at the entrance/gate and wait for you.";
        } else if (lowerText.includes('thanks') || lowerText.includes('ok')) {
            reply = "No problem! See you in a bit.";
        }

        // Delay the reply to feel human
        setTimeout(() => {
            socket.emit('chatReply', {
                text: reply,
                sender: 'them',
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            });
        }, 2000 + Math.random() * 2000);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
    });
});

module.exports = app; // For testing

/** Demo only: move a fake driver along a real road route toward the pickup. */
async function simulateDriverDrive(target, driverId) {
    const startLoc = [76.9558, 11.0168]; // Gandhipuram
    const endLoc = [76.9006, 10.9027];   // Amrita University pickup
    try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLoc[0]},${startLoc[1]};${endLoc[0]},${endLoc[1]}?overview=full&geometries=geojson`);
        const data = await res.json();
        const coords = data.routes?.[0]?.geometry.coordinates;
        if (coords) {
            let step = 0;
            const timer = setInterval(() => {
                if (step >= coords.length) return clearInterval(timer);
                const [lng, lat] = coords[step];
                target.emit('driverLocationUpdate', { driverId, lat, lng, demo: true });
                step += 3;
            }, 2000);
            return;
        }
    } catch (err) {
        console.log('[DEMO] OSRM routing failed, using a straight line:', err.message);
    }
    let [lng, lat] = startLoc;
    let count = 0;
    const timer = setInterval(() => {
        lat -= 0.0003; lng -= 0.0003;
        target.emit('driverLocationUpdate', { driverId, lat, lng, demo: true });
        if (++count > 600) clearInterval(timer);
    }, 3000);
}
