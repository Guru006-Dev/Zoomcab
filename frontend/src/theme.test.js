import { readFileSync, readdirSync } from 'node:fs';
import { test, expect } from 'vitest';

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const screens = readdirSync(new URL('.', import.meta.url), { recursive: true })
    .map((f) => f.replaceAll('\\', '/'))
    .filter((f) => /\.jsx?$/.test(f) && !f.startsWith('landing/') && !f.includes('.test.'));

const offenders = (pattern) => screens.filter((f) => pattern.test(src(`./${f}`)));

function contrast(a, b) {
    const light = (hex) => {
        const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
            .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const [x, y] = [light(a), light(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
}

test('the theme holds the landing page values', () => {
    const css = src('./theme.css');
    for (const value of ['#000000', '#181818', '#1f1f1f', '#272727', '#313131', '#5b4fe8', '#8b82ff', '#3ddc84', 'Geist Variable']) {
        expect(css.toLowerCase()).toContain(value.toLowerCase());
    }
    const get = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
    for (const text of ['text-1', 'text-2', 'text-3', 'text-4']) {
        for (const panel of ['surface', 'surface3']) expect(contrast(get(text), get(panel))).toBeGreaterThanOrEqual(4.5);
    }
    expect(src('./index.css')).not.toContain('body.dark');
});

test('no map layer that needs a key', () => {
    expect(offenders(/light_only_labels|World_Imagery/)).toEqual([]);
});

test('no white panels or gradients', () => {
    expect(offenders(/background(?:Color)?:\s*['"`](?:#fff(?:fff)?\b|white\b|rgba\(255,\s*255,\s*255,\s*0?\.[89])/i)).toEqual([]);
    expect(offenders(/\bbg-white(?![/\w])|\bbg-gray-(?:50|100|200)\b/)).toEqual([]);
    expect(offenders(/linear-gradient\(|bg-gradient-to/)).toEqual([]);
});

test('one icon family and no emoji', () => {
    expect(offenders(/lucide-react/)).toEqual([]);
    expect(offenders(/\p{Extended_Pictographic}/u)).toEqual([]);
});

test('one font', () => {
    expect(offenders(/'Inter'|Segoe UI|Plus Jakarta/)).toEqual([]);
    expect(src('../index.html')).not.toContain('fonts.googleapis');
});

test('sign in has no third party scene and can open on sign up', () => {
    expect(src('./pages/Login.jsx')).not.toMatch(/spline/i);
    expect(src('./pages/Login.jsx')).toContain("get('mode')");
    expect(src('./landing/Landing.jsx')).toContain('/login?mode=signup');
});

test('the theme switch is gone', () => {
    expect(src('./pages/Settings.jsx')).not.toMatch(/Dark Mode|ThemeToggle/);
});
