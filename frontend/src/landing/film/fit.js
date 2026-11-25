/** Fit one box to each building footprint, narrowed or dropped so no road is covered. */

const CELL = 60;
const TYPES = 14;
export const HALF_WIDTH = [4, 7.5]; // minor, major, including the kerb

/** Road points every 2 m, bucketed for lookup. */
export function roadIndex({ nodes, edges }) {
    const bins = new Map();
    for (const [a, b, major] of edges) {
        const [ax, ay] = nodes[a];
        const [bx, by] = nodes[b];
        const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2));
        for (let i = 0; i <= steps; i++) {
            const x = ax + ((bx - ax) * i) / steps;
            const y = ay + ((by - ay) * i) / steps;
            const key = `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
            if (!bins.has(key)) bins.set(key, []);
            bins.get(key).push([x, y, HALF_WIDTH[major]]);
        }
    }
    return bins;
}

function samplesNear(index, box) {
    const reach = Math.hypot(box.w, box.d) / 2 + 8;
    const found = [];
    for (let i = Math.floor((box.x - reach) / CELL); i <= Math.floor((box.x + reach) / CELL); i++) {
        for (let j = Math.floor((box.y - reach) / CELL); j <= Math.floor((box.y + reach) / CELL); j++) {
            for (const sample of index.get(`${i},${j}`) ?? []) found.push(sample);
        }
    }
    return found;
}

/** Distance of a point from the box centre, along the box's own two axes. */
function local(box, x, y) {
    const c = Math.cos(box.angle);
    const s = Math.sin(box.angle);
    const dx = x - box.x;
    const dy = y - box.y;
    return [Math.abs(dx * c + dy * s), Math.abs(-dx * s + dy * c)];
}

export function coversRoad(index, box) {
    return samplesNear(index, box).some(([x, y, half]) => {
        const [u, v] = local(box, x, y);
        return u < box.w / 2 + half - 0.001 && v < box.d / 2 + half - 0.001;
    });
}

function boundingBox(points) {
    let angle = 0;
    let longest = 0;
    points.forEach(([x, y], i) => {
        const [nx, ny] = points[(i + 1) % points.length];
        const length = Math.hypot(nx - x, ny - y);
        if (length > longest) {
            longest = length;
            angle = Math.atan2(ny - y, nx - x);
        }
    });
    angle = Math.round(angle * 1000) / 1000;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const us = points.map(([x, y]) => x * c + y * s);
    const vs = points.map(([x, y]) => -x * s + y * c);
    const u = (Math.min(...us) + Math.max(...us)) / 2;
    const v = (Math.min(...vs) + Math.max(...vs)) / 2;
    const round = (n) => Math.round(n * 10) / 10;
    return {
        x: round(u * c - v * s), y: round(u * s + v * c), angle,
        w: round(Math.max(...us) - Math.min(...us)), d: round(Math.max(...vs) - Math.min(...vs)),
    };
}

export function fitBuildings(roads, footprints) {
    const index = roadIndex(roads);
    const floor = (n) => Math.floor(n * 10 + 1e-6) / 10;
    const fitted = [];
    footprints.forEach(({ p, l }, i) => {
        const box = boundingBox(p);
        for (const [x, y, half] of samplesNear(index, box)) {
            const [u, v] = local(box, x, y);
            if (u >= box.w / 2 + half || v >= box.d / 2 + half) continue;
            const w = Math.max(0, floor(2 * (u - half)));
            const d = Math.max(0, floor(2 * (v - half)));
            if (w * box.d > box.w * d) box.w = Math.min(box.w, w);
            else box.d = Math.min(box.d, d);
        }
        if (box.w < 4 || box.d < 4) return;
        fitted.push({ ...box, h: l ? Math.round(l * 3.2 * 10) / 10 : 0, type: i % TYPES });
    });
    return fitted;
}
