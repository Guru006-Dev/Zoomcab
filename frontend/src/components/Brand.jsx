import { Taxi } from '@phosphor-icons/react';

export default function Brand({ size = 20 }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-1)', fontSize: size, fontWeight: 600, letterSpacing: '-0.02em' }}>
            <Taxi size={size * 1.4} weight="fill" color="#ffc21a" aria-hidden />
            Zoomcab
        </span>
    );
}
