import roads from './sim/roads.json';
import { buildGraph, nearestNode } from './sim/graph';

export const graph = buildGraph(roads);

/** Node nearest to an offset in metres from the middle of the map. */
export const near = (dx, dy) => nearestNode(graph, graph.width / 2 + dx, graph.height / 2 + dy);
