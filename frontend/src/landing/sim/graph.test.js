import { readFileSync, existsSync } from 'node:fs';
import { test, expect } from 'vitest';
import { buildGraph, nearestNode, shortestPath } from './graph';

const g = buildGraph({ width: 100, height: 100, nodes: [[0, 0], [10, 0], [10, 10], [90, 90]], edges: [[0, 1, 1], [1, 2, 0]] });

test('routes along edges', () => {
    expect(shortestPath(g, 0, 2)).toEqual([0, 1, 2]);
    expect(shortestPath(g, 0, 0)).toEqual([0]);
    expect(shortestPath(g, 0, 3)).toBeNull();
});

test('snaps to the connected road network only', () => {
    expect(nearestNode(g, 88, 88)).toBe(2);
});

const real = new URL('./roads.json', import.meta.url);
test('every real road node is reachable', () => {
    expect(existsSync(real)).toBe(true);
    const r = buildGraph(JSON.parse(readFileSync(real, 'utf8')));
    const seen = new Set([nearestNode(r, 0, 0)]);
    const queue = [...seen];
    while (queue.length) for (const { to } of r.adj[queue.pop()]) if (!seen.has(to)) { seen.add(to); queue.push(to); }
    expect(seen.size).toBe(r.nodes.length);
});
