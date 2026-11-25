import { useRef } from 'react';
import { Link } from 'react-router-dom';
import '@fontsource-variable/geist';
import './landing.css';
import Hero from './sections/Hero';
import Story from './sections/Story';
import Tagline from './sections/Tagline';
import AppShots from './sections/AppShots';
import Build from './sections/Build';
import Actions, { REPO } from './sections/Actions';

export default function Landing() {
    const hero = useRef(null);
    const watch = () => hero.current?.watch();

    return (
        <div className="lp">
            <a className="lp-skip" href="#how">Skip to how it works</a>
            <nav className="lp-nav" aria-label="Main">
                <a href="#hero" className="lp-brand">Zoomcab</a>
                <a href="#how">How it works</a>
                <a href={REPO}>Code</a>
                <Link to="/login">Sign in</Link>
            </nav>
            <main>
                <Hero ref={hero} />
                <Story />
                <Tagline />
                <AppShots />
                <Build />
                <section className="lp-section lp-end" aria-labelledby="end-title">
                    <h2 id="end-title">See how it works inside</h2>
                    <Actions onWatch={watch} />
                </section>
            </main>
            <footer className="lp-footer">
                <a href={REPO}>GitHub</a>
                <span>Map data <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></span>
            </footer>
        </div>
    );
}
