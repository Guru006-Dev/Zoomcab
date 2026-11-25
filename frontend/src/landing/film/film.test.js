import { test, expect } from 'vitest';
import { canFilm, progressOf } from './canFilm';
import { createSound } from './sound';

test('film needs a wide screen and WebGL', () => {
    expect(canFilm({ width: 1440, webgl: true })).toBe(true);
    expect(canFilm({ width: 899, webgl: true })).toBe(false);
    expect(canFilm({ width: 1440, webgl: false })).toBe(false);
});

test('scroll progress is clamped between the ends of the track', () => {
    expect(progressOf({ top: 0, height: 7000 }, 1000)).toBe(0);
    expect(progressOf({ top: -3000, height: 7000 }, 1000)).toBe(0.5);
    expect(progressOf({ top: -9000, height: 7000 }, 1000)).toBe(1);
    expect(progressOf({ top: 500, height: 7000 }, 1000)).toBe(0);
});

function fakeAudio() {
    const log = { contexts: 0, oscillators: 0, closed: 0 };
    const node = () => ({
        connect(next) { return next; }, start() {}, stop() {},
        frequency: { value: 0 },
        gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    });
    class Context {
        constructor() { log.contexts += 1; this.currentTime = 0; this.destination = {}; }
        createOscillator() { log.oscillators += 1; return node(); }
        createGain() { return node(); }
        resume() { return Promise.resolve(); }
        suspend() { return Promise.resolve(); }
        close() { log.closed += 1; return Promise.resolve(); }
    }
    return { log, Context };
}

test('sound is silent until asked and closes on dispose', async () => {
    const { log, Context } = fakeAudio();
    const sound = createSound(Context);
    sound.cue(1);
    expect(log.contexts).toBe(0);
    expect(await sound.toggle()).toBe(true);
    const humming = log.oscillators;
    sound.cue(1);
    expect(log.oscillators).toBeGreaterThan(humming);
    expect(await sound.toggle()).toBe(false);
    const quiet = log.oscillators;
    sound.cue(2);
    expect(log.oscillators).toBe(quiet);
    sound.dispose();
    expect(log.closed).toBe(1);
});
