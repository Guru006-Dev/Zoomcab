// Export building footprints from OpenStreetMap (ODbL) and fit them clear of the roads.
// Usage: node scripts/export-buildings.mjs [saved-footprints.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { fitBuildings } from '../src/landing/film/fit.js';

const [S, W, N, E] = [10.998, 76.945, 11.028, 76.980];
const mx = 111320 * Math.cos((((S + N) / 2) * Math.PI) / 180);
const my = 110574;

async function download() {
    const query = `[out:json][timeout:90];way["building"](${S},${W},${N},${E});out geom tags;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'User-Agent': 'roads-export', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }),
    });
    if (!res.ok) throw new Error(`Overpass returned ${res.status}`);
    const { elements } = await res.json();
    return elements.filter((e) => e.geometry?.length > 3).map((e) => ({
        p: e.geometry.slice(0, -1).map((g) => [Math.round((g.lon - W) * mx), Math.round((N - g.lat) * my)]),
        l: Number(e.tags?.['building:levels']) || 0,
    }));
}

const footprints = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], 'utf8')) : await download();
const roads = JSON.parse(readFileSync(new URL('../src/landing/sim/roads.json', import.meta.url), 'utf8'));
const spots = fitBuildings(roads, footprints).map((b) => [b.x, b.y, b.angle, b.w, b.d, b.h, b.type]);
const json = JSON.stringify({ spots });
writeFileSync(new URL('../src/landing/film/city.json', import.meta.url), json);
console.log(`${footprints.length} footprints, ${spots.length} fitted, ${(json.length / 1024).toFixed(0)} KB`);
