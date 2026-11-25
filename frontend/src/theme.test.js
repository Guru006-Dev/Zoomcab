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

test('no leftover light tints', () => {
    expect(offenders(/#(f0fdf4|fffbeb|f3f1ff|fff7ed|fef2f2|f5f3ff|f8f7ff|f3f4f6|edeef5|f0f0f8|fee2e2|dcfce7)\b/i)).toEqual([]);
});

test('no dead links and a readable brand', () => {
    expect(offenders(/href:\s*["']#["']/)).toEqual([]);
    expect(offenders(/ChatGPT Image/)).toEqual([]);
});

test('map marker html is well formed', () => {
    expect(offenders(/< div|<\/div >/)).toEqual([]);
});

test('the css reset does not override utility spacing', () => {
    expect(src('./index.css')).toMatch(/@layer base \{\s*\*,/);
});

test('icon names are never printed as words', () => {
    expect(src('./components/Badges.jsx')).not.toMatch(/^\s*badge\.icon\s*$/m);
    expect(src('./components/Glyph.jsx')).toContain('isValidElement');
});

test('payment makes no invented claims and still tells the driver', () => {
    const payment = src('./pages/Payment.jsx');
    expect(payment).not.toMatch(/safety record|256-bit|TestimonialCarousel/);
    expect(payment).toContain("socket.emit('payment_completed_broadcast', { rideId: state.rideId, driverId: state.driverId })");
});

test('violet text uses the readable shade', () => {
    expect(offenders(/(?<![-\w])color:[^,;\n}]*(var\(--primary\)|'#5b4fe8')/i)).toEqual([]);
});

test('places saved before the restyle keep their icons', () => {
    const glyph = src('./components/Glyph.jsx');
    expect(glyph).toContain("'\\u{1F3E0}': 'home'");
    expect(glyph).toContain("'\\u{1F4BC}': 'work'");
});
