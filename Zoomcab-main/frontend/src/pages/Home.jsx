import { useState, useEffect, useRef } from 'react';
import { requestRide, socket } from '../api';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Navigation, Car, Shield, ChevronRight, Search,
    Wallet, History, Settings, UserPlus, Star, Phone,
    MessageCircle, X, LocateFixed, Edit3, Award, TrendingUp,
    Facebook, Twitter, Instagram, Github, Home as HomeIcon, Wind, Sparkles, MessageSquare
} from 'lucide-react';
import L from 'leaflet';
import SafetyModal from '../components/SafetyModal';
import InAppChat from '../components/InAppChat';
import 'leaflet/dist/leaflet.css';
import useSavedPlaces from '../hooks/useSavedPlaces';
import ZoomcabLogo from '../assets/ChatGPT Image Feb 21, 2026, 09_27_37 PM.png';
import autoImage from '../assets/most-popular-transport-india-auto-600nw-2368746743-Photoroom.png';
import evImage from '../assets/Wuling-Mini-EV-Gear-Photoroom.png';
import sedanImage from '../assets/MG-Hector(1)-Photoroom.png';
import suvImage from '../assets/bmw-m5-Photoroom.png';
import { SocialTooltip } from '../components/ui/social-media';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const baseVehicles = [
    { id: 'auto', name: 'Auto', basePrice: 25, perKm: 12, timePerKm: 3, image: autoImage, icon: <img src={autoImage} alt="Auto" style={{ width: 36, height: 36, objectFit: 'contain' }} />, nearby: 4 },
    { id: 'ev', name: 'EV', basePrice: 40, perKm: 15, timePerKm: 2.5, image: evImage, icon: <img src={evImage} alt="EV" style={{ width: 44, height: 36, objectFit: 'contain' }} />, nearby: 3 },
    { id: 'sedan', name: 'Sedan', basePrice: 50, perKm: 18, timePerKm: 2.2, image: sedanImage, icon: <img src={sedanImage} alt="Sedan" style={{ width: 48, height: 36, objectFit: 'contain' }} />, nearby: 2 },
    { id: 'suv', name: 'SUV', basePrice: 80, perKm: 25, timePerKm: 2.5, image: suvImage, icon: <img src={suvImage} alt="SUV" style={{ width: 48, height: 36, objectFit: 'contain' }} />, nearby: 1 },
];

const MapUpdater = ({ center, showRoute, routePath }) => {
    const map = useMap();
    useEffect(() => {
        if (showRoute && routePath.length > 1) {
            map.flyToBounds(L.latLngBounds(routePath), { padding: [60, 60], duration: 1.2 });
        } else {
            map.flyTo(center, 14, { duration: 1.2 });
        }
    }, [center, map, showRoute, routePath]);
    return null;
};

export default function Home() {
    const navigate = useNavigate();
    const routerLoc = useLocation();

    const [stage, setStage] = useState('selection');
    const [vehicles, setVehicles] = useState(baseVehicles);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [rideDistance, setRideDistance] = useState(0);
    const [rideTime, setRideTime] = useState(0);
    const [isSafetyOpen, setIsSafetyOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isRideActive, setIsRideActive] = useState(false);
    const [driverLocation, setDriverLocation] = useState(null);
    const [driverRoutePath, setDriverRoutePath] = useState(null);
    const [showRoute, setShowRoute] = useState(false);
    const [destination, setDestination] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const geocodeTimer = useRef(null);

    const position = [10.9027, 76.9006];
    const [destinationPos, setDestinationPos] = useState([10.9964, 76.9672]);
    const [destinationName, setDestinationName] = useState('');
    const [routePath, setRoutePath] = useState([]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user?.username || user?.name || localStorage.getItem('username') || localStorage.getItem('name') || 'Rider';
    const { places } = useSavedPlaces();

    useEffect(() => {
        if (user?.id) {
            if (!socket.connected) socket.connect();
            socket.emit('join', { room: user.id });
        }
        if (routerLoc.state?.rideStatus === 'confirmed') {
            setIsRideActive(true);
            setShowRoute(true);
            window.history.replaceState({}, document.title);
        }
    }, [routerLoc]);

    useEffect(() => {
        const handleDriverLocation = (data) => {
            setDriverLocation([data.lat, data.lng]);
            setIsRideActive(true);
        };
        socket.on('driverLocationUpdate', handleDriverLocation);
        return () => socket.off('driverLocationUpdate', handleDriverLocation);
    }, []);

    useEffect(() => {
        if (isRideActive && driverLocation && !driverRoutePath) {
            const fetchDriverRoute = async () => {
                try {
                    const startLoc = driverLocation;
                    const endLoc = position;
                    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLoc[1]},${startLoc[0]};${endLoc[1]},${endLoc[0]}?overview=full&geometries=geojson`);
                    const data = await res.json();
                    if (data.routes?.[0]) {
                        setDriverRoutePath(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
                    }
                } catch (e) { }
            };
            fetchDriverRoute();
        }
    }, [isRideActive, driverLocation, driverRoutePath, position]);

    const handleBook = async () => {
        if (!selectedVehicle || !destinationName) return;
        setStage('searching');

        // Snapshot plain serializable vehicle data (no JSX icons)
        const vehicleData = {
            id: selectedVehicle.id,
            name: selectedVehicle.name,
            price: selectedVehicle.price,
            time: selectedVehicle.time,
            image: selectedVehicle.image,
        };

        // ─── Real socket acceptance waits for driver here ───
        let navigated = false;
        socket.once('rideAccepted', (data) => {
            if (!navigated) {
                navigated = true;
                navigate('/payment', {
                    state: { vehicle: vehicleData, price: vehicleData.price, rideId: data.rideId, driverId: data.driverId, surge: 1.0, pickup: destinationName, dropoff: destinationName }
                });
            }
        });

        // ─── Try the API ───
        try {
            const res = await requestRide(
                { lat: position[0], lng: position[1], address: 'Amrita University' },
                { lat: destinationPos[0], lng: destinationPos[1], address: destinationName },
                selectedVehicle.id, selectedVehicle.price
            );
            socket.emit('ride_requested_broadcast', { ride: res.data, vehicle: vehicleData });
        } catch (e) {
            console.warn('requestRide failed — firing mock socket broadcast fallback:', e.message);
            socket.emit('ride_requested_broadcast', { ride: null, vehicle: vehicleData });
        }
    };

    const handleDestinationChange = (e) => {
        const value = e.target.value;
        setDestination(value);
        setSuggestions([]);
        setShowRoute(false);
        if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
        if (value.length < 3) return;
        geocodeTimer.current = setTimeout(async () => {
            setIsGeocoding(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`, { headers: { 'Accept-Language': 'en' } });
                const data = await res.json();
                setSuggestions(data);
            } catch { setSuggestions([]); } finally { setIsGeocoding(false); }
        }, 400);
    };

    const handleSelectSuggestion = (s) => {
        const lat = parseFloat(s.lat);
        const lon = parseFloat(s.lon);
        const name = s.display_name.split(',').slice(0, 2).join(',').trim();
        setDestination(name);
        setDestinationPos([lat, lon]);
        setDestinationName(name);
        setSuggestions([]);
        setShowRoute(true);
        fetchRoute(position, [lat, lon]);
    };

    const fetchRoute = async (start, end) => {
        try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
            const data = await res.json();
            if (data.routes?.[0]) {
                const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                const distKm = (data.routes[0].distance / 1000).toFixed(1);
                const timeMin = Math.round(data.routes[0].duration / 60);
                setRoutePath(coords);
                setRideDistance(distKm);
                setRideTime(timeMin);
                setVehicles(baseVehicles.map(v => ({
                    ...v,
                    price: Math.round(v.basePrice + distKm * v.perKm),
                    time: Math.round(distKm * v.timePerKm) + ' min'
                })));
            }
        } catch { setRoutePath([start, end]); }
    };

    const navItems = [
        { label: 'Home', icon: HomeIcon, path: '/home' },
        { label: 'Wallet', icon: Wallet, path: '/wallet', badge: '₹240' },
        { label: 'My Rides', icon: History, path: '/rides' },
        { label: 'Payment', icon: TrendingUp, path: '/payment' },
        { label: 'Rewards', icon: Award, path: '/rewards' },
        { label: 'Ride Setup', icon: Wind, path: '/ride-preferences' },
        { label: 'AI Concierge', icon: Sparkles, path: '/concierge', special: true },
        { label: 'Settings', icon: Settings, path: '/settings' },
    ];

    /* ─────────────────────────────────────────────────────────── */
    return (
        <div
            className="flex h-screen w-full overflow-hidden"
            style={{ background: '#EDEEF5', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
        >

            {/* ══════════════ LEFT SIDEBAR ══════════════ */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.35 }}
                style={{
                    width: 240,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    padding: 20,
                    background: 'var(--surface)',
                    borderRight: '1px solid var(--border)',
                    boxShadow: '4px 0 24px rgba(91,79,232,0.06)',
                    overflowY: 'auto',
                    zIndex: 10,
                }}
            >
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                    <img
                        src={ZoomcabLogo}
                        alt="ZoomCab Logo"
                        style={{
                            width: 130,
                            objectFit: 'contain',
                            background: 'linear-gradient(135deg, #5B4FE8, #7C6EF5)',
                            padding: '6px 10px',
                            borderRadius: 14,
                            margin: '0 auto',
                            boxShadow: '0 4px 12px rgba(91,79,232,0.15)'
                        }}
                    />
                </div>

                {/* Avatar */}
                <div style={{
                    borderRadius: 16, padding: 16, textAlign: 'center',
                    background: 'linear-gradient(135deg,#F3F1FF,#EBF0FF)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg,#5B4FE8,#8B7CF6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, fontWeight: 800, color: '#fff',
                        }}>
                            {username[0]?.toUpperCase()}
                        </div>
                        <div style={{
                            position: 'absolute', bottom: -3, right: -3,
                            width: 13, height: 13, borderRadius: '50%',
                            background: 'var(--success)', border: '2px solid var(--surface)',
                        }} />
                    </div>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>{username}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Premium Rider</p>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {navItems.map(({ label, icon: Icon, path, badge, special }) => {
                        const active = path === '/home';
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 12px', borderRadius: 12, border: 'none',
                                    cursor: 'pointer', width: '100%', textAlign: 'left',
                                    background: active ? (special ? 'linear-gradient(135deg, #F3F1FF, #EBF0FF)' : 'var(--surface2)') : 'transparent',
                                    color: active ? 'var(--primary)' : 'var(--text-3)',
                                    fontFamily: 'var(--font)', fontWeight: special ? 700 : 600, fontSize: 13,
                                    transition: 'all 0.15s',
                                    outline: active ? (special ? '1.5px solid #8B7CF6' : '1.5px solid var(--border2)') : 'none',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface2)'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Icon size={15} style={{ color: special ? '#8B7CF6' : (active ? 'var(--primary)' : 'var(--text-4)'), flexShrink: 0 }} />
                                <span style={{ flex: 1, color: special ? '#5B4FE8' : 'inherit' }}>{label}</span>
                                {badge && <span className="badge badge-orange">{badge}</span>}
                                {!special && <ChevronRight size={13} style={{ color: 'var(--border)', flexShrink: 0 }} />}
                            </button>
                        );
                    })}
                </nav>

                {/* Safety */}
                <button
                    onClick={() => setIsSafetyOpen(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 14px', borderRadius: 12,
                        background: '#F0FDF4', color: '#16A34A',
                        border: '1px solid #BBF7D0', cursor: 'pointer',
                        fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13,
                    }}
                >
                    <Shield size={15} />
                    Safety & SOS
                </button>

                {/* Logout */}
                <button
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    style={{
                        fontSize: 12, color: 'var(--text-4)', background: 'none',
                        border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                        textAlign: 'left', padding: '4px 0',
                    }}
                >
                    Sign out →
                </button>

                {/* Social Media Component Integration */}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                    <SocialTooltip
                        items={[
                            { href: "#", ariaLabel: "Facebook", tooltip: "Facebook", color: "#1877F2", icon: Facebook },
                            { href: "#", ariaLabel: "Twitter", tooltip: "Twitter", color: "#1DA1F2", icon: Twitter },
                            { href: "#", ariaLabel: "Instagram", tooltip: "Instagram", color: "#E4405F", icon: Instagram },
                            { href: "#", ariaLabel: "Github", tooltip: "Github", color: "#333333", icon: Github },
                        ]}
                        className="gap-2"
                    />
                </div>
            </motion.aside>

            {/* ══════════════ CENTER MAP ══════════════ */}
            <div className="flex-1 relative">
                <MapContainer
                    center={position} zoom={14} zoomControl={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <MapUpdater center={position} showRoute={showRoute} routePath={routePath} />
                    <TileLayer
                        attribution='&copy; Esri'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    <TileLayer
                        attribution='&copy; CartoDB'
                        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                        opacity={0.75}
                    />
                    <Marker position={position}>
                        <Popup>📍 Amrita University (Pickup)</Popup>
                    </Marker>
                    {showRoute && (
                        <>
                            <Marker position={destinationPos}>
                                <Popup>🏁 {destinationName}</Popup>
                            </Marker>
                            <Polyline
                                positions={routePath}
                                color="#5B4FE8"
                                weight={5}
                                opacity={0.95}
                                dashArray="12,6"
                            />
                        </>
                    )}
                    {driverLocation && (
                        <Marker
                            position={driverLocation}
                            icon={new L.DivIcon({
                                html: `<div style="font-size: 24px; background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(91,79,232,0.4); border: 2.5px solid #5B4FE8; z-index: 9999;">🚘</div>`,
                                className: 'driver-live-marker',
                                iconSize: [36, 36],
                                iconAnchor: [18, 18]
                            })}
                        >
                            <Popup>Your driver is arriving!</Popup>
                        </Marker>
                    )}
                    {driverLocation && isRideActive && (
                        <Polyline
                            positions={driverRoutePath || [driverLocation, position]}
                            color="#16A34A"
                            weight={4}
                            opacity={0.8}
                            dashArray={driverRoutePath ? "" : "10,8"}
                        />
                    )}
                </MapContainer>

                {/* Top centre pill */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] pointer-events-none">
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg"
                        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(91,79,232,0.12)' }}
                    >
                        <MapPin size={13} style={{ color: '#5B4FE8' }} />
                        <span className="text-xs font-semibold" style={{ color: '#1A1D2E' }}>Coimbatore, Tamil Nadu</span>
                    </div>
                </div>

                {/* Re-centre */}
                <button
                    className="absolute bottom-6 right-6 z-[900] w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(91,79,232,0.15)', color: '#5B4FE8' }}
                >
                    <LocateFixed size={18} />
                </button>

                {/* Floating Chat Button for Active Ride */}
                {isRideActive && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsChatOpen(true)}
                        className="absolute bottom-20 right-6 z-[900] w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all"
                        style={{ background: '#5B4FE8', color: 'white', border: 'none', boxShadow: '0 8px 24px rgba(91,79,232,0.4)' }}
                    >
                        <MessageSquare size={24} />
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, background: '#22c55e', borderRadius: '50%', border: '2px solid white' }}></div>
                    </motion.button>
                )}
            </div>

            {/* ══════════════ RIGHT BOOKING PANEL ══════════════ */}
            <motion.aside
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{ background: '#fff', boxShadow: '-4px 0 24px rgba(91,79,232,0.06)', width: '22rem' }}
                className="shrink-0 flex flex-col z-10 overflow-y-auto border-l border-[#EDEEF5]"
            >
                {/* ── Active ride header ── */}
                <AnimatePresence>
                    {isRideActive && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-[#F0F0F8]"
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-sm" style={{ color: '#1A1D2E' }}>Arriving</span>
                                    <span className="font-bold text-sm" style={{ color: '#5B4FE8' }}>5 min</span>
                                </div>
                                <div
                                    className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ background: '#F8F7FF', border: '1px solid rgba(91,79,232,0.1)' }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                        style={{ background: 'linear-gradient(135deg,#5B4FE8,#8B7CF6)' }}
                                    >
                                        D
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold" style={{ color: '#1A1D2E' }}>Driver1</p>
                                        <p className="text-xs text-gray-400">Maruti Swift · KA 03 AB 4521</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star size={12} style={{ color: '#FACC15', fill: '#FACC15' }} />
                                        <span className="text-xs font-bold" style={{ color: '#1A1D2E' }}>4.8</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                                        style={{ background: '#F3F4F6', color: '#374151' }}
                                    ><MessageCircle size={14} /> Chat</button>
                                    <button
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                                        style={{ background: '#5B4FE8', color: '#fff' }}
                                    ><Phone size={14} /> Call</button>
                                    <button
                                        onClick={() => setIsRideActive(false)}
                                        className="py-2.5 px-3 rounded-xl text-sm transition-all hover:bg-gray-100"
                                        style={{ color: '#9CA3AF' }}
                                    ><X size={15} /></button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Inputs ── */}
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 12
                    }}>
                        Your Journey
                    </p>

                    {/* Pickup */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        borderRadius: 14, background: 'var(--surface2)', border: '1px solid var(--border)',
                        marginBottom: 6
                    }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: '50%', background: 'var(--success)',
                            boxShadow: '0 0 0 4px rgba(34,197,94,0.15)', flexShrink: 0
                        }} />
                        <input
                            readOnly
                            defaultValue="Amrita University, Ettimadai"
                            style={{
                                background: 'transparent', width: '100%', border: 'none', outline: 'none',
                                fontSize: 13, fontFamily: 'var(--font)', fontWeight: 600, color: 'var(--text-1)'
                            }}
                        />
                        <LocateFixed size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    </div>

                    {/* connector */}
                    <div style={{
                        marginLeft: 18, height: 16, borderLeft: '2px dashed var(--border)', marginBottom: 6
                    }} />

                    {/* Destination */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                            borderRadius: 14, transition: 'all 0.2s',
                            background: destination ? 'var(--surface2)' : 'var(--surface)',
                            border: destination ? '1px solid var(--primary)' : '1px solid var(--border)',
                            boxShadow: destination ? '0 0 0 1px var(--primary)' : 'none'
                        }}>
                            <div style={{
                                width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)',
                                boxShadow: '0 0 0 4px rgba(91,79,232,0.12)', flexShrink: 0
                            }} />
                            <input
                                type="text"
                                placeholder="Where to?"
                                value={destination}
                                onChange={handleDestinationChange}
                                style={{
                                    background: 'transparent', width: '100%', border: 'none', outline: 'none',
                                    fontSize: 13, fontFamily: 'var(--font)', fontWeight: 600, color: 'var(--text-1)'
                                }}
                            />
                            {isGeocoding ? (
                                <div style={{
                                    width: 14, height: 14, border: '2px solid var(--primary)',
                                    borderTopColor: 'transparent', borderRadius: '50%',
                                    animation: 'spin 1s linear infinite', flexShrink: 0
                                }} />
                            ) : destination ? (
                                <button
                                    onClick={() => { setDestination(''); setSuggestions([]); setShowRoute(false); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                                >
                                    <X size={14} style={{ color: 'var(--text-4)' }} />
                                </button>
                            ) : (
                                <Search size={14} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                            )}
                        </div>

                        {/* Suggestions */}
                        <AnimatePresence>
                            {suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl overflow-hidden"
                                    style={{ background: '#fff', boxShadow: '0 12px 40px rgba(91,79,232,0.15)', border: '1px solid rgba(91,79,232,0.1)' }}
                                >
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectSuggestion(s)}
                                            className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[#F8F7FF]"
                                            style={{ borderBottom: i < suggestions.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                                        >
                                            <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: '#5B4FE8' }} />
                                            <span className="text-[12px] text-gray-600 leading-snug line-clamp-2">{s.display_name}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Trip summary ── */}
                <AnimatePresence>
                    {rideDistance > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            style={{ padding: '0 20px 16px 20px', borderBottom: '1px solid var(--border)' }}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                                padding: '14px 16px', background: 'var(--surface2)', borderRadius: 16,
                                border: '1px solid rgba(91,79,232,0.1)'
                            }}>
                                {[
                                    { icon: '📍', val: `${rideDistance} km`, lbl: 'Distance' },
                                    { icon: '⏱', val: `${rideTime} min`, lbl: 'Est. Time' },
                                    { icon: '₹', val: selectedVehicle ? `${selectedVehicle.price}` : '--', lbl: 'Fare' },
                                ].map(item => (
                                    <div key={item.lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <span style={{ fontSize: 13 }}>{item.icon}</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{item.val}</span>
                                        <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{item.lbl}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Vehicle grid ── */}
                <div style={{ padding: 20, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <p style={{
                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '0.12em', color: 'var(--text-4)'
                        }}>Choose Ride</p>
                        {!destination && <span style={{ fontSize: 10, color: 'var(--text-4)', opacity: 0.7 }}>Enter destination first</span>}
                    </div>

                    {stage === 'searching' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 16 }}>
                            <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(91,79,232,0.15)', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                                <div style={{
                                    padding: 20, borderRadius: '50%', zIndex: 10, boxShadow: '0 8px 24px rgba(91,79,232,0.25)',
                                    background: 'linear-gradient(135deg,var(--primary),#8B7CF6)'
                                }}>
                                    <Car size={32} color="#fff" />
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Finding your driver…</p>
                                <p style={{ fontSize: 13, color: 'var(--text-4)', marginTop: 4 }}>Usually under a minute</p>
                            </div>
                            <button
                                onClick={() => setStage('selection')}
                                style={{
                                    fontSize: 13, color: 'var(--text-4)', textDecoration: 'underline',
                                    background: 'none', border: 'none', cursor: 'pointer', marginTop: 8
                                }}
                            >Cancel</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                            {vehicles.map((v) => {
                                const isSelected = selectedVehicle?.id === v.id;
                                return (
                                    <motion.button
                                        key={v.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setSelectedVehicle(v)}
                                        style={{
                                            position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            gap: 6, padding: '16px 12px', borderRadius: 16, textAlign: 'center', transition: 'all 0.2s',
                                            background: isSelected ? 'linear-gradient(135deg,#F3F1FF,#EBF0FF)' : 'var(--surface2)',
                                            border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                            boxShadow: isSelected ? '0 8px 20px rgba(91,79,232,0.15)' : 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {isSelected && (
                                            <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
                                        )}
                                        <span style={{ fontSize: 28, filter: !isSelected && 'grayscale(0.4) opacity(0.8)' }}>{v.icon}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{v.name}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{v.nearby} nearby</span>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: isSelected ? 'var(--primary)' : 'var(--text-2)' }}>
                                            {v.price ? `₹${v.price}` : '—'}
                                        </span>
                                        {v.time && <span style={{ fontSize: 10, color: 'var(--text-4)', marginTop: -2 }}>{v.time}</span>}
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}

                    {/* Book CTA */}
                    {stage !== 'searching' && (
                        <motion.button
                            whileHover={{ scale: selectedVehicle && destination ? 1.02 : 1 }}
                            whileTap={{ scale: selectedVehicle && destination ? 0.98 : 1 }}
                            onClick={handleBook}
                            disabled={!selectedVehicle || !destination}
                            style={{
                                width: '100%', padding: '16px', borderRadius: 16,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                fontFamily: 'var(--font)', fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
                                transition: 'all 0.2s', border: 'none', cursor: selectedVehicle && destination ? 'pointer' : 'not-allowed',
                                ...(selectedVehicle && destination
                                    ? { background: 'linear-gradient(135deg,var(--primary),#7C6EF5)', color: '#fff', boxShadow: '0 12px 24px rgba(91,79,232,0.3)' }
                                    : { background: 'var(--surface2)', color: 'var(--text-4)', border: '1px solid var(--border)' })
                            }}
                        >
                            <Navigation size={18} />
                            {!destination ? 'Enter a Destination' : !selectedVehicle ? 'Select a Vehicle' : 'Request Ride'}
                        </motion.button>
                    )}
                </div>

                {/* ── Saved Places ── */}
                <div style={{ padding: 20, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <p style={{
                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '0.12em', color: 'var(--text-4)'
                        }}>Saved Places</p>
                        <button
                            onClick={() => navigate('/saved-places')}
                            style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Manage →
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {places.slice(0, 3).map((place) => (
                            <button
                                key={place.id}
                                onClick={() => {
                                    if (place.address) {
                                        setDestination(place.address);
                                        handleDestinationChange({ target: { value: place.address } });
                                    }
                                }}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                                    borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)',
                                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                            >
                                <span style={{ fontSize: 18, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{place.icon}</span>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{place.name}</p>
                                    <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {place.address || 'Tap to set address'}
                                    </p>
                                </div>
                                <Edit3 size={12} style={{ color: 'var(--text-4)', opacity: 0.6 }} />
                            </button>
                        ))}
                    </div>
                </div>
            </motion.aside>

            <AnimatePresence>
                {isChatOpen && (
                    <InAppChat
                        recipientName="Driver"
                        onClose={() => setIsChatOpen(false)}
                    />
                )}
            </AnimatePresence>

            <SafetyModal isOpen={isSafetyOpen} onClose={() => setIsSafetyOpen(false)} />
        </div>
    );
}
