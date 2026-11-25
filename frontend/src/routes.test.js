import { readFileSync } from 'node:fs';
import { test, expect } from 'vitest';
const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('landing is at / and sign in at /login', () => {
    expect(src('./App.jsx')).toMatch(/path="\/" element=\{<Landing \/>\}/);
    expect(src('./App.jsx')).toMatch(/path="\/login" element=\{<Login \/>\}/);
});

test('nothing signs out to the landing page', () => {
    for (const f of ['./components/PageLayout.jsx', './pages/Home.jsx',
        './pages/DriverDashboard.jsx', './pages/Settings.jsx']) {
        expect(src(f)).not.toMatch(/navigate\('\/'\)/);
    }
    expect(src('./pages/NotFound.jsx')).toContain('to="/login"');
});
