const { calculateDistance } = require('../utils/geo');

describe('calculateDistance (Haversine, km)', () => {
    test('is zero for the same point', () => {
        expect(calculateDistance(10.9, 76.9, 10.9, 76.9)).toBe(0);
    });

    test('one degree of latitude is about 111 km', () => {
        expect(calculateDistance(0, 0, 1, 0)).toBeCloseTo(111.19, 1);
    });

    test('Chennai to Bengaluru is about 290 km', () => {
        const d = calculateDistance(13.0827, 80.2707, 12.9716, 77.5946);
        expect(d).toBeGreaterThan(280);
        expect(d).toBeLessThan(300);
    });

    test('is symmetric', () => {
        expect(calculateDistance(10.9, 76.9, 11.0, 77.0)).toBeCloseTo(calculateDistance(11.0, 77.0, 10.9, 76.9), 10);
    });
});

describe('config', () => {
    const loadConfig = (env) => {
        const saved = process.env;
        process.env = { ...saved };
        for (const [k, v] of Object.entries(env)) {
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
        try {
            let cfg;
            jest.isolateModules(() => { cfg = require('../config'); });
            return cfg;
        } finally {
            process.env = saved;
        }
    };

    test('refuses to start in production without JWT_SECRET', () => {
        expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: undefined })).toThrow(/JWT_SECRET/);
    });

    test('uses JWT_SECRET when set', () => {
        expect(loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'abc' }).jwtSecret).toBe('abc');
    });

    test('demo mode defaults on in development and off in production', () => {
        expect(loadConfig({ NODE_ENV: 'development', DEMO_MODE: undefined, JWT_SECRET: 'x' }).demoMode).toBe(true);
        expect(loadConfig({ NODE_ENV: 'production', DEMO_MODE: undefined, JWT_SECRET: 'x' }).demoMode).toBe(false);
    });

    test('demo logins are seeded in development only, unless overridden', () => {
        expect(loadConfig({ NODE_ENV: 'development', SEED_DEMO_USERS: undefined, JWT_SECRET: 'x' }).seedDemoUsers).toBe(true);
        expect(loadConfig({ NODE_ENV: 'production', SEED_DEMO_USERS: undefined, JWT_SECRET: 'x' }).seedDemoUsers).toBe(false);
        expect(loadConfig({ NODE_ENV: 'production', SEED_DEMO_USERS: 'true', JWT_SECRET: 'x' }).seedDemoUsers).toBe(true);
    });

    test('DEMO_MODE overrides the default', () => {
        expect(loadConfig({ NODE_ENV: 'production', DEMO_MODE: 'true', JWT_SECRET: 'x' }).demoMode).toBe(true);
        expect(loadConfig({ NODE_ENV: 'development', DEMO_MODE: 'false', JWT_SECRET: 'x' }).demoMode).toBe(false);
    });
});
