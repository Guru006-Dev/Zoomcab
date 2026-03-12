import React from 'react';

const RiderBackground = ({ isNight }) => {
    // Gradients for Day/Night
    // Day: Sunset vibes (Orange/Purple)
    // Night: Cyberpunk vibes (Deep Blue/Neon)
    const skyGradient = isNight
        ? "linear-gradient(to bottom, #020024 0%, #090979 50%, #00d4ff 100%)"
        : "linear-gradient(to bottom, #8E2DE2 0%, #4A00E0 50%, #FF512F 100%)";

    const sunMoonColor = isNight ? "#F5F3CE" : "#FF512F";
    const sunMoonglow = isNight ? "0 0 20px #F5F3CE" : "0 0 50px #FF512F";

    return (
        <div
            className="absolute inset-0 overflow-hidden -z-10 transition-all duration-1000 ease-in-out"
            style={{ background: skyGradient }}
        >
            {/* --- SKY & HORIZON --- */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Sun/Moon */}
                <div
                    className="absolute bottom-[40%] left-1/2 transform -translate-x-1/2 w-64 h-64 rounded-full transition-all duration-1000"
                    style={{
                        background: sunMoonColor,
                        boxShadow: sunMoonglow,
                        filter: 'blur(2px)'
                    }}
                ></div>

                {/* Stars (Night Only) */}
                {isNight && Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full animate-twinkle"
                        style={{
                            top: `${Math.random() * 40}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 2}px`,
                            height: `${Math.random() * 2}px`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            {/* --- CITY SKYLINE (Scrolling) --- */}
            <div className="absolute bottom-[35%] w-[200%] h-[350px] flex items-end opacity-80 animate-city-scroll">
                {/* City Silhouette SVG repeating - BLOCKY SKYSCRAPERS */}
                <svg className="w-1/2 h-full" viewBox="0 0 1000 350" preserveAspectRatio="none">
                    {/* Layer 1: Back Skyscrapers */}
                    <path d="M0,350 L50,150 L100,350 L120,80 L200,350 L250,50 L350,350 L400,100 L450,350 L550,120 L650,350 L700,60 L800,350 L850,100 L950,350 Z" fill="none" />
                    <rect x="0" y="200" width="60" height="150" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="80" y="100" width="50" height="250" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="150" y="180" width="70" height="170" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="250" y="50" width="60" height="300" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="350" y="150" width="80" height="200" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="450" y="220" width="50" height="130" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="550" y="80" width="90" height="270" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="680" y="180" width="60" height="170" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="780" y="120" width="70" height="230" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="900" y="200" width="80" height="150" fill={isNight ? "#020210" : "#2a0845"} />

                    {/* Windows */}
                    {isNight && (
                        <g fill="#FFF" opacity="0.4">
                            <rect x="90" y="120" width="5" height="5" />
                            <rect x="90" y="140" width="5" height="5" />
                            <rect x="260" y="80" width="5" height="5" />
                            <rect x="260" y="100" width="5" height="5" />
                            <rect x="570" y="100" width="5" height="5" />
                            <rect x="570" y="120" width="5" height="5" />
                        </g>
                    )}
                </svg>
                <svg className="w-1/2 h-full" viewBox="0 0 1000 350" preserveAspectRatio="none">
                    <rect x="0" y="200" width="60" height="150" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="80" y="100" width="50" height="250" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="150" y="180" width="70" height="170" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="250" y="50" width="60" height="300" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="350" y="150" width="80" height="200" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="450" y="220" width="50" height="130" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="550" y="80" width="90" height="270" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="680" y="180" width="60" height="170" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="780" y="120" width="70" height="230" fill={isNight ? "#020210" : "#2a0845"} />
                    <rect x="900" y="200" width="80" height="150" fill={isNight ? "#020210" : "#2a0845"} />
                </svg>
            </div>

            {/* --- ROAD (Perspective Highway) --- */}
            <div className="absolute bottom-0 w-full h-[35%] bg-gradient-to-b from-[#111] to-[#000] perspective-[500px] overflow-hidden border-t-4 border-white/10">
                {/* Road Surface Texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjNDQ0Ii8+PC9zdmc+')] opacity-20"></div>

                {/* Moving Lane Markers */}
                <div className="absolute inset-0 flex justify-center transform-style-3d rotate-x-60">
                    {/* Left Lane Line */}
                    <div className="absolute left-[30%] w-2 h-[200%] bg-dashed-white animate-road-scroll opacity-50"></div>
                    {/* Center Lane Line (Solid/Yellow) */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-[200%] bg-yellow-500/80 animate-road-scroll"></div>
                    {/* Right Lane Line */}
                    <div className="absolute right-[30%] w-2 h-[200%] bg-dashed-white animate-road-scroll opacity-50"></div>
                </div>
            </div>

            {/* --- CAR (REAR VIEW) --- */}
            <div className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2 w-[340px] h-[180px] animate-bounce-gentle z-10 transition-all duration-300">
                <svg viewBox="0 0 300 160" className="w-full h-full drop-shadow-2xl">
                    {/* Car Body (Rear) */}
                    <path d="M20,100 L280,100 L290,140 L10,140 Z" fill="#111" /> {/* Bumper */}
                    <path d="M30,100 L270,100 L250,50 L50,50 Z" fill={isNight ? "#000" : "#222"} stroke={isNight ? "#333" : "#555"} strokeWidth="1" /> {/* Cabin */}

                    {/* Rear Window */}
                    <path d="M60,55 L240,55 L260,95 L40,95 Z" fill="url(#windowGradient)" opacity="0.8" />

                    {/* Heads (Silhouettes in Rear Window) */}
                    {/* Driver */}
                    <circle cx="90" cy="75" r="10" fill="black" />
                    <path d="M75,95 Q90,85 105,95" fill="black" />
                    {/* Passenger */}
                    <circle cx="210" cy="75" r="10" fill="black" />
                    <path d="M195,95 Q210,85 225,95" fill="black" />

                    {/* Tail Lights (Glowing) */}
                    <rect x="20" y="105" width="40" height="15" fill="#ff0000" className="animate-pulse-fast" style={{ filter: 'drop-shadow(0 0 10px #ff0000)' }} />
                    <rect x="240" y="105" width="40" height="15" fill="#ff0000" className="animate-pulse-fast" style={{ filter: 'drop-shadow(0 0 10px #ff0000)' }} />

                    {/* License Plate */}
                    <rect x="110" y="110" width="80" height="20" fill="#FFD700" stroke="black" />
                    <text x="150" y="125" textAnchor="middle" fontSize="12" fontWeight="bold" fill="black">WELCOME</text>

                    {/* Tires */}
                    <rect x="10" y="130" width="30" height="20" rx="5" fill="#111" />
                    <rect x="260" y="130" width="30" height="20" rx="5" fill="#111" />

                    <defs>
                        <linearGradient id="windowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8E2DE2" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#4A00E0" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <style jsx>{`
        @keyframes grid-scroll {
            0% { background-position: 0 0; }
            100% { background-position: 0 40px; }
        }
        .animate-grid-scroll {
            animation: grid-scroll 0.5s linear infinite;
        }
        @keyframes city-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-city-scroll {
            animation: city-scroll 20s linear infinite;
        }
        @keyframes bounce-gentle {
            0%, 100% { transform: translate(-50%, 0); }
            50% { transform: translate(-50%, -2px); }
        }
        .animate-bounce-gentle {
            animation: bounce-gentle 1s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default RiderBackground;
