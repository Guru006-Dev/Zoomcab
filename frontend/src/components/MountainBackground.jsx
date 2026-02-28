import React from 'react';

const MountainBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#050510] -z-10">
            <svg
                className="absolute bottom-0 left-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
                viewBox="0 0 1440 900"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0f0c29" />
                        <stop offset="50%" stopColor="#302b63" />
                        <stop offset="100%" stopColor="#24243e" />
                    </linearGradient>
                    <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff9933" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#ff6600" stopOpacity="0.2" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Sky */}
                <rect width="100%" height="100%" fill="url(#skyGradient)" />

                {/* Stars */}
                <g fill="white" opacity="0.6">
                    <circle cx="100" cy="100" r="1" className="animate-twinkle" />
                    <circle cx="300" cy="200" r="1.5" className="animate-twinkle delay-500" />
                    <circle cx="500" cy="80" r="1" className="animate-twinkle delay-200" />
                    <circle cx="800" cy="150" r="2" className="animate-twinkle delay-700" />
                    <circle cx="1200" cy="100" r="1.5" className="animate-twinkle delay-300" />
                    <circle cx="1300" cy="300" r="1" className="animate-twinkle delay-900" />
                    <circle cx="200" cy="400" r="1" className="animate-twinkle" />
                    <circle cx="600" cy="350" r="1.5" className="animate-twinkle delay-400" />
                    <circle cx="900" cy="250" r="1" className="animate-twinkle delay-100" />
                    <circle cx="1100" cy="50" r="2" className="animate-twinkle delay-600" />
                </g>

                {/* Moon/Saffron Sun */}
                <circle cx="1200" cy="150" r="80" fill="url(#moonGradient)" filter="url(#glow)" opacity="0.8" />

                {/* Mountains - Back Layer */}
                <path
                    d="M0,900 L0,500 C200,550 400,450 600,600 C800,750 1000,500 1200,600 C1300,650 1440,550 1440,900 Z"
                    fill="#1c1c3c"
                    opacity="0.6"
                />

                {/* Mountains - Middle Layer */}
                <path
                    d="M0,900 L0,650 C150,700 300,600 500,700 C700,800 900,650 1100,750 C1300,850 1440,700 1440,900 Z"
                    fill="#13132b"
                    opacity="0.8"
                />

                {/* Mountains - Front Layer */}
                <path
                    d="M0,900 L0,750 C100,800 250,700 400,800 C600,900 800,750 1000,850 C1200,950 1440,800 1440,900 Z"
                    fill="#050510"
                />

                {/* Road/Cyber Lines */}
                <path
                    d="M720,900 L680,850 M720,900 L760,850"
                    stroke="#ff9933"
                    strokeWidth="2"
                    opacity="0.3"
                />
            </svg>

            {/* Fog Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent opacity-80"></div>
        </div>
    );
};

export default MountainBackground;
