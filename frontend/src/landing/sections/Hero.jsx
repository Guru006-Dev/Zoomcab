import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import CityMap from '../CityMap';
import Actions from './Actions';
import { graph, near } from '../city';
import { createWorld, requestRide } from '../sim/world';

const PICKUP = near(250, -150);
const PLACES = [
    { name: 'North side', node: near(150, -1100) },
    { name: 'East side', node: near(1100, 100) },
    { name: 'South side', node: near(100, 900) },
];

const STATUS = {
    searching: 'Looking for the nearest free driver.',
    to_pickup: 'Matched. The driver is on the way to the pickup.',
    to_dropoff: 'Rider picked up. Heading to the destination.',
    done: 'Ride complete. Pick another destination.',
};

const Hero = forwardRef(function Hero(_, ref) {
    const [world] = useState(() => createWorld(graph, { count: 28, seed: 4 }));
    const [phase, setPhase] = useState(undefined);
    const ride = useCallback((node) => { requestRide(world, PICKUP, node); }, [world]);
    const watch = useCallback(() => {
        ride(PLACES[Math.floor(Math.random() * PLACES.length)].node);
        document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
    }, [ride]);
    useImperativeHandle(ref, () => ({ watch }), [watch]);
    useEffect(() => { ride(PLACES[1].node); }, [ride]);

    return (
        <section id="hero" className="lp-hero">
            <div className="lp-hero-map">
                <CityMap graph={graph} world={world} running onPick={ride} onPhase={setPhase}
                    label="Simulated map of Coimbatore with drivers matching a ride" />
                <span className="lp-badge">Simulation</span>
            </div>
            <div className="lp-hero-panel">
                <h1>Watch a ride<br />find its driver</h1>
                <p>Zoomcab matches riders with the nearest free driver and updates only the two of them. Tap the map to try it.</p>
                <Actions onWatch={watch} />
                <div className="lp-places" role="group" aria-label="Choose a destination">
                    {PLACES.map((place) => (
                        <button type="button" key={place.name} onClick={() => ride(place.node)}>{place.name}</button>
                    ))}
                </div>
                <p className="lp-status" aria-live="polite">{STATUS[phase]}</p>
            </div>
        </section>
    );
});

export default Hero;
