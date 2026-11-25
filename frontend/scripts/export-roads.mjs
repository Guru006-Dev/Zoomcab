// One off export of a few square kilometres of Coimbatore roads from OpenStreetMap (ODbL).
// Usage: node scripts/export-roads.mjs
import { writeFileSync } from 'node:fs';
import { buildGraph } from '../src/landing/sim/graph.js';

const [S, W, N, E] = [10.998, 76.945, 11.028, 76.980];
const MAJOR = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];
const MIN_MINOR_METRES = Number(process.argv[2] ?? 0);
const query = `[out:json][timeout:60];way["highway"~"^(${MAJOR.join('|')}|residential|unclassified)$"](${S},${W},${N},${E});(._;>;);out body;`;

const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'User-Agent': 'roads-export', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: query }),
});
if (!res.ok) throw new Error(`Overpass returned ${res.status}`);
const { elements } = await res.json();

const mx = 111320 * Math.cos((((S + N) / 2) * Math.PI) / 180);
const my = 110574;
const coords = new Map(elements.filter((e) => e.type === 'node')
    .map((e) => [e.id, [Math.round((e.lon - W) * mx), Math.round((N - e.lat) * my)]]));
const inside = ([x, y]) => x >= 0 && y >= 0 && x <= (E - W) * mx && y <= (N - S) * my;

const nodes = [];
const index = new Map();
const idOf = (osmId) => {
    if (!index.has(osmId)) { index.set(osmId, nodes.length); nodes.push(coords.get(osmId)); }
    return index.get(osmId);
};
const edges = [];
for (const way of elements.filter((e) => e.type === 'way')) {
    const major = MAJOR.includes(way.tags.highway) ? 1 : 0;
    const ids = way.nodes.filter((id) => inside(coords.get(id)));
    const length = ids.slice(1).reduce((sum, id, i) => sum + Math.hypot(coords.get(id)[0] - coords.get(ids[i])[0], coords.get(id)[1] - coords.get(ids[i])[1]), 0);
    if (!major && length < MIN_MINOR_METRES) continue;
    for (let i = 1; i < ids.length; i++) edges.push([idOf(ids[i - 1]), idOf(ids[i]), major]);
}

// Keep only the largest connected network.
const size = { width: Math.round((E - W) * mx), height: Math.round((N - S) * my) };
const keep = new Map(buildGraph({ ...size, nodes, edges }).main.map((old, i) => [old, i]));
const out = {
    ...size,
    nodes: [...keep.keys()].map((old) => nodes[old]),
    edges: edges.filter(([a]) => keep.has(a)).map(([a, b, m]) => [keep.get(a), keep.get(b), m]),
};
const json = JSON.stringify(out);
writeFileSync(new URL('../src/landing/sim/roads.json', import.meta.url), json);
console.log(`${out.nodes.length} nodes, ${out.edges.length} edges, ${(json.length / 1024).toFixed(0)} KB`);
