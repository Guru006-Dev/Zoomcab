require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    if (isProduction) {
        throw new Error('JWT_SECRET must be set in production. See backend/.env.example.');
    }
    jwtSecret = 'dev-only-insecure-secret';
    console.warn('[CONFIG] JWT_SECRET not set — using an insecure development secret. Set it in backend/.env.');
}

module.exports = {
    isProduction,
    port: parseInt(process.env.PORT || '5000', 10),
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    // Demo mode auto-accepts rides with a simulated driver so a single person can test the rider flow.
    demoMode: process.env.DEMO_MODE !== 'false' && !isProduction,
    instanceId: process.env.INSTANCE_ID || `instance-${process.pid}`,
};
