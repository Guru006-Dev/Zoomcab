import { useState, useEffect, useRef } from 'react';

// Mock Sound URLs (In a real app, these would be local imports)
// Using standard placeholder sounds or empty strings for now.
// For the piano music, we can use a reliable CDN link if available, or just placeholder logic.

const SOUNDS = {
    hover: 'https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-interface-robot-click-901.mp3', // Sci-fi blip
    click: 'https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3', // Digital click
    success: 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3', // Success chime
    piano: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3?filename=relaxing-piano-music-10476.mp3', // Placeholder Piano Loop
};

export const useAudio = () => {
    const audioRefs = useRef({});
    const [isMuted, setIsMuted] = useState(true); // Default muted to comply with autoplay

    useEffect(() => {
        // Initialize Audio objects
        Object.entries(SOUNDS).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.volume = key === 'piano' ? 0.3 : 0.5;
            if (key === 'piano') audio.loop = true;
            audioRefs.current[key] = audio;
        });

        return () => {
            // Cleanup
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
        };
    }, []);

    const playSound = (key) => {
        if (isMuted && key !== 'piano') return; // Don't play SFX if muted, but piano is special case
        const audio = audioRefs.current[key];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Audio play failed (user interaction needed)", e));
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);

        // Handle Background Music
        if (!newMuted) {
            audioRefs.current['piano']?.play().catch(e => console.log("Music play failed", e));
        } else {
            audioRefs.current['piano']?.pause();
        }
    };

    return { playSound, isMuted, toggleMute };
};
