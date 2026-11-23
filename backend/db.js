/**
 * PostgreSQL + PostGIS access.
 *
 * One connection pool per process. Every backend instance shares the same database, and
 * correctness under concurrency comes from single-statement conditional UPDATEs
 * (e.g. "accept only if still pending"), which Postgres applies atomically.
 */
const { Pool, types } = require('pg');
const bcrypt = require('bcryptjs');
const config = require('./config');

// Return COUNT(*) (int8) and NUMERIC (fares, averages) as JS numbers instead of strings.
types.setTypeParser(20, (v) => parseInt(v, 10));
types.setTypeParser(1700, (v) => parseFloat(v));

const pool = new Pool({ connectionString: config.databaseUrl, max: 10 });
pool.on('error', (err) => console.error('[DB] Idle client error:', err.message));

/** Run a query; returns the pg result ({ rows, rowCount }). */
const query = (sql, params = []) => pool.query(sql, params);
/** First row or undefined. */
const one = async (sql, params) => (await pool.query(sql, params)).rows[0];
/** All rows. */
const many = async (sql, params) => (await pool.query(sql, params)).rows;

/** Build a PostGIS geography point from lat/lng (note: PostGIS takes lng first). */
const POINT = (lngParam, latParam) => `ST_SetSRID(ST_MakePoint(${lngParam}, ${latParam}), 4326)::geography`;

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        TEXT UNIQUE NOT NULL,
    password        TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('rider', 'driver')),
    loyalty_points  INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0)
);

CREATE TABLE IF NOT EXISTS drivers (
    user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'offline',
    location     geography(Point, 4326),
    vehicle_type TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Spatial index: nearest-driver search uses ST_DWithin + KNN ordering (<->).
CREATE INDEX IF NOT EXISTS drivers_location_gix ON drivers USING GIST (location);
CREATE INDEX IF NOT EXISTS drivers_status_idx ON drivers (status);

CREATE TABLE IF NOT EXISTS rides (
    id              SERIAL PRIMARY KEY,
    rider_id        INTEGER NOT NULL REFERENCES users(id),
    driver_id       INTEGER REFERENCES users(id),
    pickup_lat      DOUBLE PRECISION NOT NULL,
    pickup_lng      DOUBLE PRECISION NOT NULL,
    dropoff_lat     DOUBLE PRECISION,
    dropoff_lng     DOUBLE PRECISION,
    pickup_address  TEXT,
    dropoff_address TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',
    fare            NUMERIC(10, 2),
    vehicle_type    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rides_driver_status_idx ON rides (driver_id, status);

CREATE TABLE IF NOT EXISTS reviews (
    id          SERIAL PRIMARY KEY,
    ride_id     INTEGER NOT NULL REFERENCES rides(id),
    rider_id    INTEGER NOT NULL REFERENCES users(id),
    driver_id   INTEGER NOT NULL REFERENCES users(id),
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ride_id, rider_id)
);
`;

/**
 * Create tables (idempotent) and seed demo users if enabled. Several instances start at once,
 * so a transaction-level advisory lock makes them run this one at a time.
 */
async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(7243001)');
        await client.query(SCHEMA);
        if (config.seedDemoUsers) {
            const seed = `INSERT INTO users (username, password, role) VALUES ($1, $2, $3)
                          ON CONFLICT (username) DO NOTHING`;
            await client.query(seed, ['Guru', bcrypt.hashSync('123456', 10), 'rider']);
            await client.query(seed, ['Driver1', bcrypt.hashSync('password', 10), 'driver']);
        }
        await client.query('COMMIT');
        console.log('[DB] Schema ready');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        throw err;
    } finally {
        client.release();
    }
}

const close = () => pool.end();

module.exports = { pool, query, one, many, migrate, close, POINT };
