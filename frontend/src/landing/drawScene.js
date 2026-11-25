import { acceptRide, nearestFreeDriver, recipients } from './sim/match';

const ROAD = '#272727';
const ROAD_MAJOR = '#454545';
const ACCENT = '#8b82ff';
const OK = '#3ddc84';
const WARN = '#ff8a65';
const CAR = '#e8e8e8';

/** Cover the box with the map, or zoom to `focus` = {node, radius in metres}. */
export function makeView(graph, w, h, focus) {
    const scale = focus
        ? Math.min(w, h) / (focus.radius * 2)
        : Math.max(w / graph.width, h / graph.height);
    const [cx, cy] = focus ? graph.nodes[focus.node] : [graph.width / 2, graph.height / 2];
    return { w, h, scale, dx: w / 2 - cx * scale, dy: h / 2 - cy * scale };
}

export const toScreen = (view, x, y) => [x * view.scale + view.dx, y * view.scale + view.dy];
export const toWorld = (view, sx, sy) => [(sx - view.dx) / view.scale, (sy - view.dy) / view.scale];

function line(ctx, view, points, color, width, dash = []) {
    if (points.length < 2) return;
    ctx.beginPath();
    points.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](...toScreen(view, x, y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
}

function dot(ctx, view, [x, y], radius, color, ring) {
    const [sx, sy] = toScreen(view, x, y);
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (ring) {
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = ring;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function label(ctx, view, [x, y], text, color) {
    const [sx, sy] = toScreen(view, x, y);
    ctx.font = "600 14px 'Geist Variable', sans-serif";
    const width = ctx.measureText(text).width + 16;
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - width / 2, sy - 40, width, 24);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, sx, sy - 28);
}

function roads(ctx, graph, view) {
    for (const major of [0, 1]) {
        ctx.beginPath();
        for (const [a, b, m] of graph.edges) {
            if (m !== major) continue;
            ctx.moveTo(...toScreen(view, ...graph.nodes[a]));
            ctx.lineTo(...toScreen(view, ...graph.nodes[b]));
        }
        ctx.strokeStyle = major ? ROAD_MAJOR : ROAD;
        ctx.lineWidth = major ? 2.5 : 1;
        ctx.stroke();
    }
}

/**
 * highlight: null (live ride), 'nearest', 'race' or 'private' (the story diagrams).
 */
export function drawScene(ctx, graph, world, view, highlight) {
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.lineCap = 'round';
    roads(ctx, graph, view);

    const ride = world.ride;
    const at = (d) => [d.x, d.y];
    const pickup = ride && graph.nodes[ride.pickup];
    const winner = ride && (world.drivers.find((d) => d.id === ride.driverId)
        ?? nearestFreeDriver(graph, world.drivers, ride.pickup));
    const second = ride && winner
        && nearestFreeDriver(graph, world.drivers.filter((d) => d !== winner), ride.pickup);

    if (highlight === 'nearest') {
        for (const d of world.drivers) {
            line(ctx, view, [pickup, at(d)], d === winner ? ACCENT : '#5a5a5a', d === winner ? 3 : 1, d === winner ? [] : [4, 6]);
        }
    }
    if (highlight === 'race') {
        line(ctx, view, [pickup, at(winner)], OK, 3);
        line(ctx, view, [pickup, at(second)], WARN, 2, [4, 6]);
    }
    if (!highlight && ride && ride.phase !== 'done') {
        const driver = world.drivers.find((d) => d.id === ride.driverId);
        if (driver) {
            const motion = world.motion[world.drivers.indexOf(driver)];
            line(ctx, view, [at(driver), ...motion.path.map((n) => graph.nodes[n])], ride.phase === 'to_pickup' ? OK : ACCENT, 3.5);
        }
    }

    const told = ride && highlight === 'private' ? recipients({ ...ride, driverId: winner.id }) : null;
    for (const d of world.drivers) {
        const matched = d.id === ride?.driverId || (highlight && highlight !== 'nearest' && d === winner);
        const dim = told && !told.includes(d.id);
        dot(ctx, view, at(d), matched ? 7 : 5, dim ? '#4a4a4a' : matched ? OK : CAR, matched ? OK : null);
    }

    if (!ride) return;
    dot(ctx, view, pickup, 7, ACCENT, ACCENT);
    if (!highlight) dot(ctx, view, graph.nodes[ride.dropoff], 6, '#fff', '#fff');
    if (highlight === 'race') {
        const first = acceptRide({ ...ride, driverId: null }, winner.id);
        const late = acceptRide(first.ride, second.id);
        label(ctx, view, at(winner), `${first.status} accepted`, OK);
        label(ctx, view, at(second), `${late.status} refused`, WARN);
    }
    if (highlight === 'private') {
        label(ctx, view, pickup, 'rider is told', ACCENT);
        label(ctx, view, at(winner), 'driver is told', OK);
    }
}
