import { readFileSync } from 'node:fs';
import { test, expect } from 'vitest';
import { fitBuildings, coversRoad, roadIndex } from './fit';

const road = { nodes: [[0, 0], [200, 0]], edges: [[0, 1, 1]] };
const square = (cx, cy) => ({ p: [[cx - 10, cy - 10], [cx + 10, cy - 10], [cx + 10, cy + 10], [cx - 10, cy + 10]], l: 0 });

test('drops a building that sits on the road', () => {
    expect(fitBuildings(road, [square(100, 0)])).toEqual([]);
});

test('narrows a building that overlaps the road edge', () => {
    const [b] = fitBuildings(road, [square(100, 12)]);
    expect(b.y - b.d / 2).toBeGreaterThanOrEqual(7.5);
    expect(b.d).toBeGreaterThan(8);
});

test('leaves a distant building alone', () => {
    expect(fitBuildings(road, [square(100, 60)])[0]).toMatchObject({ x: 100, y: 60, w: 20, d: 20 });
});

test('no building in the real city covers a road', () => {
    const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
    const { spots } = read('./city.json');
    const index = roadIndex(read('../sim/roads.json'));
    const bad = spots.filter(([x, y, angle, w, d]) => coversRoad(index, { x, y, angle, w, d }));
    expect(spots.length).toBeGreaterThan(8000);
    expect(bad).toEqual([]);
});
