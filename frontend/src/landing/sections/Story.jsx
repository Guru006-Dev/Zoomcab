import { useEffect, useRef, useState } from 'react';
import CityMap from '../CityMap';
import { graph, near } from '../city';
import { createWorld } from '../sim/world';

const STEPS = [
    { key: 'nearest', title: 'The nearest driver gets the offer', text: 'Driver positions sit in a Redis geo index, with PostGIS as the fallback. A short script reserves the driver, so one driver never holds two offers.' },
    { key: 'race', title: 'Two drivers accept, one wins', text: 'The ride is claimed with a single conditional update in Postgres. The first accept succeeds and the other is refused with a 409.' },
    { key: 'private', title: 'Only two people hear about it', text: 'Each socket joins a private room for its user. The rider and the matched driver get updates, and nobody else does.' },
];

const PICKUP = near(0, 0);
const SPOTS = [[-170, -90], [230, 120], [90, -300], [-320, 240], [380, -220], [40, 340]];

/** A still scene with drivers placed around one pickup. */
function scene() {
    const world = createWorld(graph, { count: SPOTS.length });
    const [px, py] = graph.nodes[PICKUP];
    SPOTS.forEach(([dx, dy], i) => {
        const [x, y] = graph.nodes[near(px - graph.width / 2 + dx, py - graph.height / 2 + dy)];
        Object.assign(world.drivers[i], { x, y });
    });
    world.ride = { phase: 'searching', riderId: 'rider', driverId: null, pickup: PICKUP, dropoff: PICKUP, path: [] };
    return world;
}

function StepMap({ step }) {
    const [world] = useState(scene);
    return <CityMap graph={graph} world={world} highlight={step.key} focus={{ node: PICKUP, radius: 480 }} label={`Diagram: ${step.title}`} />;
}

export default function Story() {
    const [active, setActive] = useState(0);
    const refs = useRef([]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) setActive(Number(entry.target.dataset.step));
            }
        }, { rootMargin: '-45% 0px -45% 0px' });
        refs.current.forEach((node) => node && observer.observe(node));
        return () => observer.disconnect();
    }, []);

    return (
        <section id="how" className="lp-story" aria-labelledby="how-title">
            <h2 id="how-title">How a match happens</h2>
            <div className="lp-story-grid">
                <div className="lp-story-pinned" aria-hidden>
                    {STEPS.map((step, i) => (
                        <div key={step.key} className="lp-layer" data-active={i === active}><StepMap step={step} /></div>
                    ))}
                </div>
                <ol>
                    {STEPS.map((step, i) => (
                        <li key={step.key} data-step={i} ref={(node) => { refs.current[i] = node; }}>
                            <div className="lp-story-inline"><StepMap step={step} /></div>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
