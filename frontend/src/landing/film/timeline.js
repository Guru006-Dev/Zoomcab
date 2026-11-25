/** The film as a pure function of scroll position, so scrolling back rewinds it. */
import { nearestNode, shortestPath } from '../sim/graph';
import { nearestFreeDriver } from '../sim/match';

export const SCENES = [
    { title: 'Scroll.', detail: 'One night ride across Coimbatore.' },
    { title: '11:42. You tap.', detail: 'Your pickup lights up and the search begins.' },
    { title: 'Two say yes. I keep one.', detail: 'The first accept gets 200. The second gets 409.' },
    { title: 'Nobody else hears a word.', detail: 'Only you and your driver get updates.' },
    { title: 'My lead server dies.', detail: 'This scene shows leader election only. The full cluster has not been run yet.' },
    { title: 'Another takes over.', detail: 'Leader election picks a new instance.' },
    { title: 'You arrive.', detail: 'One ride finds one driver.' },
];

const clamp = (n) => Math.min(1, Math.max(0, n));

export function createRide(graph) {
    const near = (dx, dy) => nearestNode(graph, graph.width / 2 + dx, graph.height / 2 + dy);
    const pickup = near(250, -150);
    const dropoff = near(-500, 800);
    const starts = [near(-40, 120), near(520, -380)];
    const drivers = starts.map((node) => {
        const [x, y] = graph.nodes[node];
        return { node, x, y, status: 'free' };
    });
    const winner = nearestFreeDriver(graph, drivers, pickup);
    const loser = drivers.find((d) => d !== winner);
    const points = (a, b) => shortestPath(graph, a, b).map((n) => graph.nodes[n]);
    return {
        pickup,
        dropoff,
        loserStart: loser.node,
        approach: points(winner.node, pickup),
        trip: points(pickup, dropoff),
        rival: points(loser.node, pickup),
    };
}

/** Position and heading a fraction `t` of the way along a path. */
export function along(points, t) {
    const lengths = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
    let left = clamp(t) * lengths.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < lengths.length - 1 && left > lengths[i]) left -= lengths[i++];
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1] ?? points[i];
    const k = lengths[i] ? Math.min(1, left / lengths[i]) : 0;
    return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, heading: Math.atan2(-(by - ay), bx - ax) };
}

export function stateAt(ride, progress) {
    const s = clamp(progress) * (SCENES.length - 1);
    const matched = s > 1.6;
    return {
        s,
        scene: Math.round(s),
        car: s < 3 ? along(ride.approach, (s - 1.5) / 1.5) : along(ride.trip, (s - 3) / 3),
        matched,
        rivalRefused: matched && s < 2.5,
        rivalOpacity: s > 2.5 ? 0.15 : 1,
        othersOpacity: s > 2.4 && s < 3.6 ? 0.1 : 1,
        fault: Math.max(0, 1 - Math.abs(s - 4) * 1.6),
        showPickup: s < 2.7,
    };
}
