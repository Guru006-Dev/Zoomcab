/** Optional film sound, generated in the browser. Nothing exists until the first toggle. */
export function createSound(Context = window.AudioContext) {
    let audio = null;
    let on = false;

    const voice = (freq, volume, type = 'sine') => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = type;
        oscillator.frequency.value = freq;
        gain.gain.value = volume;
        oscillator.connect(gain).connect(audio.destination);
        return { oscillator, gain };
    };

    const tone = (freq, length, { type, volume = 0.18, delay = 0 } = {}) => {
        const { oscillator, gain } = voice(freq, 0.0001, type);
        const start = audio.currentTime + delay;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
        oscillator.start(start);
        oscillator.stop(start + length);
    };

    const CUES = {
        1: () => { tone(660, 0.5); tone(990, 0.6, { delay: 0.12 }); },
        2: () => { tone(880, 0.25, { type: 'triangle' }); tone(180, 0.3, { type: 'square', volume: 0.05, delay: 0.2 }); },
        3: () => tone(523, 0.8, { volume: 0.12 }),
        4: () => [0, 0.09, 0.2].forEach((delay, i) => tone(90 - i * 20, 0.18, { type: 'sawtooth', volume: 0.1, delay })),
        5: () => [392, 523, 659].forEach((f, i) => tone(f, 0.7, { volume: 0.12, delay: i * 0.12 })),
        6: () => [523, 784].forEach((f, i) => tone(f, 1.4, { volume: 0.14, delay: i * 0.18 })),
    };

    return {
        async toggle() {
            if (!audio) {
                audio = new Context();
                for (const f of [55, 82.5]) voice(f, 0.04).oscillator.start(); // low city hum
            }
            on = !on;
            await (on ? audio.resume() : audio.suspend());
            return on;
        },
        cue(scene) {
            if (on) CUES[scene]?.();
        },
        /** Pause while the tab is hidden. */
        hidden(isHidden) {
            if (on) (isHidden ? audio.suspend() : audio.resume());
        },
        dispose() {
            on = false;
            audio?.close();
            audio = null;
        },
    };
}
