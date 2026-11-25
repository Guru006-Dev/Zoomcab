import { useEffect, useRef } from 'react';

const LINES = ['One ride finds one driver.', 'Only those two hear about it.'];

export default function Tagline() {
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                // lit once it has crossed the trigger line, including when scrolled past quickly
                if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                    entry.target.dataset.lit = 'true';
                    observer.unobserve(entry.target);
                }
            }
        }, { rootMargin: '0px 0px -35% 0px', threshold: 1 });
        ref.current.querySelectorAll('span[data-word]').forEach((word) => observer.observe(word));
        return () => observer.disconnect();
    }, []);

    let order = 0;
    return (
        <section className="lp-tagline" ref={ref}>
            <p>
                {LINES.map((line) => (
                    <span className="lp-line" key={line}>
                        {line.split(' ').map((word) => (
                            <span data-word key={word} style={{ transitionDelay: `${(order++ % 6) * 90}ms` }}>{word} </span>
                        ))}
                    </span>
                ))}
            </p>
        </section>
    );
}
