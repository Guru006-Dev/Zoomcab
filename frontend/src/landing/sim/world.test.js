import { readFileSync } from 'node:fs';
import { test, expect } from 'vitest';
import { buildGraph, nearestNode } from './graph';
import { createWorld, requestRide, step } from './world';

const g = buildGraph(JSON.parse(readFileSync(new URL('./roads.json', import.meta.url), 'utf8')));
const pickup = nearestNode(g, 1000, 1000);
const dropoff = nearestNode(g, 2600, 2400);
const busy = (w) => w.drivers.filter((d) => d.status === 'busy').length;

test('a ride runs through every phase and frees the driver', () => {
    const w = createWorld(g, { seed: 3 });
    requestRide(w, pickup, dropoff);
    const phases = new Set([w.ride.phase]);
    for (let i = 0; i < 20000 && w.ride.phase !== 'done'; i++) phases.add(step(w, 0.1).ride.phase);
    expect([...phases]).toEqual(['searching', 'to_pickup', 'to_dropoff', 'done']);
    expect(busy(w)).toBe(0);
});

test('a new request replaces the running one', () => {
    const w = createWorld(g);
    requestRide(w, pickup, dropoff);
    for (let i = 0; i < 30; i++) step(w, 0.1);
    requestRide(w, dropoff, pickup);
    for (let i = 0; i < 30; i++) step(w, 0.1);
    expect(busy(w)).toBe(1);
});

test('a long pause does not make cars jump', () => {
    const a = createWorld(g);
    const b = createWorld(g);
    step(a, 600);
    step(b, 0.1);
    expect(a.drivers).toEqual(b.drivers);
});

test('the same seed gives the same city', () => {
    expect(createWorld(g, { seed: 7 }).drivers).toEqual(createWorld(g, { seed: 7 }).drivers);
    expect(createWorld(g).drivers).toHaveLength(12);
});

test('a replaced driver stays on the road', () => {
    const w = createWorld(g, { seed: 3 });
    requestRide(w, pickup, dropoff);
    for (let i = 0; i < 20; i++) step(w, 0.1);
    const i = w.drivers.findIndex((d) => d.id === w.ride.driverId);
    const next = w.motion[i].path[0];
    requestRide(w, dropoff, pickup);
    expect(w.motion[i].path).toEqual([next]);
});
