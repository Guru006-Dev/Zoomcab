import { test, expect } from 'vitest';
import { buildGraph } from './graph';
import { nearestFreeDriver, acceptRide, recipients } from './match';

const g = buildGraph({ width: 100, height: 100, nodes: [[0, 0], [10, 0], [50, 0]], edges: [[0, 1, 1], [1, 2, 1]] });
const drivers = [
    { id: 'a', x: 8, y: 0, status: 'busy' },
    { id: 'b', x: 40, y: 0, status: 'free' },
    { id: 'c', x: 20, y: 0, status: 'free' },
];

test('picks the nearest free driver', () => {
    expect(nearestFreeDriver(g, drivers, 1).id).toBe('c');
    expect(nearestFreeDriver(g, [drivers[0]], 1)).toBeNull();
});

test('only the first accept wins', () => {
    const first = acceptRide({ riderId: 'rider', driverId: null }, 'c');
    const second = acceptRide(first.ride, 'b');
    expect([first.status, second.status]).toEqual([200, 409]);
    expect(second.ride.driverId).toBe('c');
    expect(recipients(second.ride)).toEqual(['rider', 'c']);
});
