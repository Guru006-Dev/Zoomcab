/** Road graph: nodes are [x, y] in metres, edges are [a, b, major]. */
export function buildGraph({ width, height, nodes, edges }) {
    const adj = nodes.map(() => []);
    for (const [a, b] of edges) {
        const length = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]);
        adj[a].push({ to: b, length });
        adj[b].push({ to: a, length });
    }
    const graph = { width, height, nodes, edges, adj };
    graph.main = largestComponent(adj);
    return graph;
}

function largestComponent(adj) {
    const seen = new Set();
    let best = [];
    for (let start = 0; start < adj.length; start++) {
        if (seen.has(start)) continue;
        const part = [start];
        seen.add(start);
        for (let i = 0; i < part.length; i++) {
            for (const { to } of adj[part[i]]) {
                if (!seen.has(to)) { seen.add(to); part.push(to); }
            }
        }
        if (part.length > best.length) best = part;
    }
    return best;
}

/** Closest node on the largest connected network, so a route always exists. */
export function nearestNode(graph, x, y) {
    let best = graph.main[0];
    let bestD = Infinity;
    for (const i of graph.main) {
        const d = Math.hypot(graph.nodes[i][0] - x, graph.nodes[i][1] - y);
        if (d < bestD) { bestD = d; best = i; }
    }
    return best;
}

/** Dijkstra with a binary heap. Returns node indexes, or null if unreachable. */
export function shortestPath(graph, from, to) {
    const dist = new Map([[from, 0]]);
    const prev = new Map();
    const heap = [[0, from]];
    const swap = (i, j) => { [heap[i], heap[j]] = [heap[j], heap[i]]; };
    const push = (item) => {
        heap.push(item);
        for (let i = heap.length - 1; i > 0;) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            swap(i, p);
            i = p;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            for (let i = 0; ;) {
                let m = i;
                for (const c of [2 * i + 1, 2 * i + 2]) if (c < heap.length && heap[c][0] < heap[m][0]) m = c;
                if (m === i) break;
                swap(i, m);
                i = m;
            }
        }
        return top;
    };
    while (heap.length) {
        const [d, node] = pop();
        if (node === to) {
            const path = [to];
            while (path[0] !== from) path.unshift(prev.get(path[0]));
            return path;
        }
        if (d > dist.get(node)) continue;
        for (const edge of graph.adj[node]) {
            const next = d + edge.length;
            if (next < (dist.get(edge.to) ?? Infinity)) {
                dist.set(edge.to, next);
                prev.set(edge.to, node);
                push([next, edge.to]);
            }
        }
    }
    return null;
}
