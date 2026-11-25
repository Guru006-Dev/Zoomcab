import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import './film.css';
import Hero from '../sections/Hero';
import Actions from '../sections/Actions';
import { graph } from '../city';
import { canFilm, hasWebgl, progressOf, WIDE } from './canFilm';
import { SCENES, createRide, stateAt } from './timeline';
import { createSound } from './sound';

const LAST = SCENES.length - 1;

/**
 * The scroll driven 3D ride. Shows the 2D hero instead on narrow screens, without WebGL,
 * or if loading or the graphics context fails.
 */
const Film = forwardRef(function Film(_, ref) {
    const [webgl] = useState(hasWebgl);
    const [width, setWidth] = useState(window.innerWidth);
    const [failed, setFailed] = useState(false);
    const [ready, setReady] = useState(false);
    const [scene, setScene] = useState(0);
    const [soundOn, setSoundOn] = useState(false);
    const track = useRef(null);
    const stage = useRef(null);
    const sound = useRef(null);
    const hero = useRef(null);
    const film = canFilm({ width, webgl }) && !failed;

    useEffect(() => {
        const media = window.matchMedia(`(min-width: ${WIDE}px)`);
        const update = () => setWidth(window.innerWidth);
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    useImperativeHandle(ref, () => ({
        watch() {
            if (!film) {
                hero.current?.watch();
                return;
            }
            const box = track.current;
            box.focus({ preventScroll: true });
            const step = (box.offsetHeight - window.innerHeight) / LAST;
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: box.offsetTop + step, behavior: reduced ? 'auto' : 'smooth' });
        },
    }), [film]);

    useEffect(() => {
        if (!film) return undefined;
        let live = true;
        let drawing = null;
        let frame = 0;
        let last = 0;
        let progress = null;
        let current = -1;
        let away = false;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // a fresh canvas each time, because a disposed graphics context cannot be reused
        const canvas = document.createElement('canvas');
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Stylised night view of Coimbatore with a simulated ride');
        stage.current.append(canvas);
        const audio = createSound();
        sound.current = audio;
        const ride = createRide(graph);
        const fail = () => { if (live) setFailed(true); };
        canvas.addEventListener('webglcontextlost', fail);
        const hide = () => audio.hidden(document.hidden);
        document.addEventListener('visibilitychange', hide);
        const resize = () => drawing?.resize(canvas.clientWidth, canvas.clientHeight);
        window.addEventListener('resize', resize);

        const tick = (now) => {
            frame = requestAnimationFrame(tick);
            const box = track.current?.getBoundingClientRect();
            // Suspense hides the film with display:none while another page loads
            const gone = !box || box.height === 0;
            if (gone !== away) {
                away = gone;
                audio.hidden(gone);
            }
            if (gone) return;
            const dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            if (box.bottom < 0) return; // scrolled past the film
            const target = progressOf(box, window.innerHeight);
            progress = progress === null || reduced ? target : progress + (target - progress) * (1 - Math.exp(-6 * dt));
            const next = Math.round(target * LAST);
            if (next !== current) {
                current = next;
                setScene(next);
                audio.cue(next);
            }
            drawing?.render(stateAt(ride, progress), now);
        };
        frame = requestAnimationFrame(tick);

        (async () => {
            try {
                const [{ createScene }, city] = await Promise.all([import('./scene'), import('./city.json')]);
                const made = await createScene(canvas, {
                    graph, spots: city.default.spots, ride, reduced, base: `${import.meta.env.BASE_URL}kit/`,
                });
                if (!live) {
                    made.dispose();
                    return;
                }
                drawing = made;
                resize();
                setReady(true);
            } catch (error) {
                console.error('Film failed to load', error);
                fail();
            }
        })();

        return () => {
            live = false;
            cancelAnimationFrame(frame);
            canvas.removeEventListener('webglcontextlost', fail);
            document.removeEventListener('visibilitychange', hide);
            window.removeEventListener('resize', resize);
            drawing?.dispose();
            audio.dispose();
            canvas.remove();
            setReady(false);
            setSoundOn(false);
        };
    }, [film]);

    if (!film) return <Hero ref={hero} />;

    return (
        <section id="hero" className="lp-film" ref={track} tabIndex={-1} aria-label="One night ride">
            <div className="lp-film-view">
                <a className="lp-film-skip" href="#app">Skip the film</a>
                <div className="lp-film-stage" ref={stage} />
                <div className="lp-caption" data-on={scene === 0} inert={scene !== 0}>
                    <h1>Watch a ride<br />find its driver</h1>
                    <p>{SCENES[0].title} {SCENES[0].detail}</p>
                    <Actions onWatch={() => ref.current?.watch()} />
                </div>
                {SCENES.slice(1).map((s, i) => (
                    <div className="lp-caption" key={s.title} data-on={scene === i + 1} inert={scene !== i + 1}>
                        <h2>{s.title}</h2>
                        <p>{s.detail}</p>
                        {i + 1 === LAST && <Actions onWatch={() => ref.current?.watch()} />}
                    </div>
                ))}
                <p className="lp-film-announce" aria-live="polite">{scene > 0 ? `${SCENES[scene].title} ${SCENES[scene].detail}` : ''}</p>
                {!ready && <p className="lp-film-loading" role="status">Building the city…</p>}
                <button type="button" className="lp-film-sound" aria-pressed={soundOn}
                    onClick={async () => {
                        const on = await sound.current.toggle();
                        setSoundOn(on);
                        sound.current.cue(scene);
                    }}>
                    {soundOn ? <SpeakerHigh size={18} aria-hidden /> : <SpeakerSlash size={18} aria-hidden />}
                    {soundOn ? 'Sound on' : 'Sound off'}
                </button>
                <span className="lp-film-badge">Simulation · stylised city</span>
            </div>
        </section>
    );
});

export default Film;
