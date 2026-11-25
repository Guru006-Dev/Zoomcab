import { useEffect, useRef } from 'react';
import { drawScene, makeView, toWorld } from './drawScene';
import { nearestNode } from './sim/graph';
import { step } from './sim/world';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Run the simulation until the ride moves to its next phase (for still frames). */
function jumpToNextPhase(world) {
    const phase = world.ride?.phase;
    for (let i = 0; i < 5000 && world.ride?.phase === phase; i++) step(world, 0.1);
}

export default function CityMap({ graph, world, running = false, onPick, onPhase, highlight = null, focus = null, label }) {
    const ref = useRef(null);
    const view = useRef(null);
    const props = useRef({});
    useEffect(() => { props.current = { onPhase, highlight, focus }; });

    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas.getContext('2d');
        let frame = 0;
        let timer = 0;
        let last = 0;
        let onScreen = true;
        let phase;

        const draw = () => {
            if (!view.current) return;
            drawScene(ctx, graph, world, view.current, props.current.highlight);
            const next = world.ride?.phase;
            if (next !== phase) {
                phase = next;
                props.current.onPhase?.(next);
            }
        };

        const resize = () => {
            const { width, height } = canvas.getBoundingClientRect();
            if (!width || !height) return;
            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            view.current = makeView(graph, width, height, props.current.focus);
            draw();
        };

        const tick = (now) => {
            if (onScreen && !document.hidden) {
                step(world, last ? (now - last) / 1000 : 0);
                draw();
            }
            last = now;
            frame = requestAnimationFrame(tick);
        };

        const sizes = new ResizeObserver(resize);
        sizes.observe(canvas);
        const seen = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; });
        seen.observe(canvas);
        resize();
        document.fonts?.ready.then(draw);

        if (running) {
            if (reducedMotion()) {
                timer = setInterval(() => {
                    if (world.ride && world.ride.phase !== 'done') jumpToNextPhase(world);
                    draw();
                }, 1200);
            } else {
                frame = requestAnimationFrame(tick);
            }
        }

        return () => {
            cancelAnimationFrame(frame);
            clearInterval(timer);
            sizes.disconnect();
            seen.disconnect();
        };
    }, [graph, world, running]);

    const pick = (event) => {
        if (!onPick || !view.current) return;
        const box = ref.current.getBoundingClientRect();
        const [x, y] = toWorld(view.current, event.clientX - box.left, event.clientY - box.top);
        onPick(nearestNode(graph, x, y));
    };

    return <canvas ref={ref} className="lp-map" role="img" aria-label={label} onClick={pick} />;
}
