import React from 'react';
import { motion } from 'framer-motion';

const GlassBackground = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#050505]">
            {/* Animated Orbs */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px]"
            />

            <motion.div
                animate={{
                    x: [0, -70, 0],
                    y: [0, 100, 0],
                    scale: [1, 1.5, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]"
            />

            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, 50, 0],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 5 }}
                className="absolute top-[30%] left-[30%] w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[100px]"
            />

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* Glass Overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[100px]" />
        </div>
    );
};

export default GlassBackground;
