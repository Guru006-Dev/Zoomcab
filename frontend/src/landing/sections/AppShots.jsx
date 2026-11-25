import rider from '../shots/rider.webp';
import driver from '../shots/driver.webp';

const SHOTS = [
    { src: rider, title: 'Rider', alt: 'Rider home screen with a map and a choice of vehicles' },
    { src: driver, title: 'Driver', alt: 'Driver dashboard with a map and a button to go online' },
];

export default function AppShots() {
    return (
        <section id="app" className="lp-section" aria-labelledby="app-title">
            <h2 id="app-title">The app behind it</h2>
            <div className="lp-shots">
                {SHOTS.map((shot) => (
                    <figure key={shot.title}>
                        <img src={shot.src} alt={shot.alt} width="390" height="844" loading="lazy" />
                        <figcaption>{shot.title}</figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}
