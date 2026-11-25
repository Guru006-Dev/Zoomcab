import { shortestPath } from './graph';
import { nearestFreeDriver, acceptRide } from './match';

const IDLE_SPEED = 40; // metres per second, sped up so movement reads on screen
const RIDE_SPEED = 260;
const SEARCH_SECONDS = 0.9;
const MAX_STEP = 0.1; // a hidden tab must not make cars leap on return

function random(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function createWorld(graph, { count = 12, seed = 1 } = {}) {
    const rand = random(seed);
    const drivers = [];
    const motion = [];
    for (let i = 0; i < count; i++) {
        const at = graph.main[Math.floor(rand() * graph.main.length)];
        const [x, y] = graph.nodes[at];
        drivers.push({ id: `d${i + 1}`, x, y, status: 'free' });
        motion.push({ at, from: at, path: [] });
    }
    return { graph, drivers, motion, rand, ride: null };
}

function release(world) {
    const i = world.drivers.findIndex((d) => d.id === world.ride?.driverId);
    if (i < 0) return;
    world.drivers[i].status = 'free';
    world.motion[i].path = world.motion[i].path.slice(0, 1); // finish the segment, stay on the road
}

export function requestRide(world, pickup, dropoff) {
    release(world);
    world.ride = { phase: 'searching', riderId: 'rider', driverId: null, pickup, dropoff, path: [], wait: SEARCH_SECONDS };
    return world;
}

/** Move a car along its path by up to `budget` metres. */
function advance(world, i, budget) {
    const driver = world.drivers[i];
    const motion = world.motion[i];
    while (motion.path.length && budget > 0) {
        const [x, y] = world.graph.nodes[motion.path[0]];
        const d = Math.hypot(x - driver.x, y - driver.y);
        if (d <= budget) {
            driver.x = x;
            driver.y = y;
            budget -= d;
            motion.from = motion.at;
            motion.at = motion.path.shift();
        } else {
            driver.x += ((x - driver.x) / d) * budget;
            driver.y += ((y - driver.y) / d) * budget;
            budget = 0;
        }
    }
}

function wander(world, i) {
    const motion = world.motion[i];
    if (motion.path.length) return;
    const all = world.graph.adj[motion.at];
    const onward = all.filter((e) => e.to !== motion.from);
    const pool = onward.length ? onward : all;
    if (pool.length) motion.path = [pool[Math.floor(world.rand() * pool.length)].to];
}

/** Send a car to `target`, first finishing the road segment it is on. */
function drive(world, i, target) {
    const motion = world.motion[i];
    const next = motion.path[0] ?? motion.at;
    motion.path = shortestPath(world.graph, next, target) ?? [];
    return [...motion.path];
}

function updateRide(world, dt) {
    const ride = world.ride;
    if (!ride || ride.phase === 'done') return;
    if (ride.phase === 'searching') {
        ride.wait -= dt;
        if (ride.wait > 0) return;
        const driver = nearestFreeDriver(world.graph, world.drivers, ride.pickup);
        if (!driver) return;
        driver.status = 'busy';
        const accepted = acceptRide(ride, driver.id).ride;
        const path = drive(world, world.drivers.indexOf(driver), ride.pickup);
        world.ride = { ...accepted, phase: 'to_pickup', path };
        return;
    }
    const i = world.drivers.findIndex((d) => d.id === ride.driverId);
    if (world.motion[i].path.length) return;
    if (ride.phase === 'to_pickup') {
        world.ride = { ...ride, phase: 'to_dropoff', path: drive(world, i, ride.dropoff) };
    } else {
        release(world);
        world.ride = { ...ride, phase: 'done', path: [] };
    }
}

export function step(world, dtSeconds) {
    const dt = Math.min(dtSeconds, MAX_STEP);
    updateRide(world, dt);
    world.drivers.forEach((driver, i) => {
        if (driver.status === 'free') wander(world, i);
        advance(world, i, (driver.status === 'busy' ? RIDE_SPEED : IDLE_SPEED) * dt);
    });
    return world;
}
