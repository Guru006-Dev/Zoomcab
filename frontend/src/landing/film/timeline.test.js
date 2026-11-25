import { readFileSync } from 'node:fs';
import { test, expect } from 'vitest';
import { buildGraph } from '../sim/graph';
import { SCENES, createRide, stateAt } from './timeline';

const g = buildGraph(JSON.parse(readFileSync(new URL('../sim/roads.json', import.meta.url), 'utf8')));
const ride = createRide(g);

test('seven scenes from first to last', () => {
    expect(SCENES).toHaveLength(7);
    expect(stateAt(ride, 0).scene).toBe(0);
    const end = stateAt(ride, 1);
    expect(end.scene).toBe(6);
    const [x, y] = g.nodes[ride.dropoff];
    expect(Math.hypot(end.car.x - x, end.car.y - y)).toBeLessThan(0.5);
});

test('each scene shows its behaviour', () => {
    expect(stateAt(ride, 2 / 6)).toMatchObject({ matched: true, rivalRefused: true, fault: 0 });
    expect(stateAt(ride, 3 / 6).othersOpacity).toBeLessThanOrEqual(0.1);
    expect(stateAt(ride, 4 / 6).fault).toBeCloseTo(1);
    expect(stateAt(ride, 1).fault).toBe(0);
});

function distanceToRoad(x, y) {
    let best = Infinity;
    for (const [a, b] of g.edges) {
        const [ax, ay] = g.nodes[a];
        const [bx, by] = g.nodes[b];
        const dx = bx - ax;
        const dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
        best = Math.min(best, Math.hypot(x - ax - dx * t, y - ay - dy * t));
    }
    return best;
}

test('the taxi stays on a road', () => {
    for (let i = 0; i <= 100; i++) {
        const { car } = stateAt(ride, i / 100);
        expect(distanceToRoad(car.x, car.y)).toBeLessThan(0.5);
    }
});

test('state depends only on the position, and is clamped', () => {
    stateAt(ride, 0.8);
    expect(stateAt(ride, 0.2)).toEqual(stateAt(createRide(g), 0.2));
    expect(stateAt(ride, -1)).toEqual(stateAt(ride, 0));
    expect(stateAt(ride, 9)).toEqual(stateAt(ride, 1));
});
