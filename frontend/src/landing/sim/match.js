/** Nearest free driver by straight line distance, as the server's geo radius search does. */
export function nearestFreeDriver(graph, drivers, node) {
    const [x, y] = graph.nodes[node];
    let best = null;
    let bestD = Infinity;
    for (const driver of drivers) {
        const d = Math.hypot(driver.x - x, driver.y - y);
        if (driver.status === 'free' && d < bestD) {
            best = driver;
            bestD = d;
        }
    }
    return best;
}

/** One winner: mirrors the conditional UPDATE that gives the loser a 409. */
export function acceptRide(ride, driverId) {
    if (ride.driverId) return { ride, status: 409 };
    return { ride: { ...ride, driverId }, status: 200 };
}

/** Who receives updates about this ride. */
export const recipients = (ride) => [ride.riderId, ride.driverId].filter(Boolean);
