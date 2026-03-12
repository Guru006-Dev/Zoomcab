import { useState, useEffect } from 'react';
import { socket, updateLocation, completeRide } from '../api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, TrendingUp, BarChart3, Coffee, Receipt, MapPin, Star, ChevronRight, Facebook, Twitter, Instagram, Github } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SocialTooltip } from '../components/ui/social-media';
import ZoomcabLogo from '../assets/ChatGPT Image Feb 21, 2026, 09_27_37 PM.png';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const Stat = ({ label, value, sub, color, colorBg, icon: Icon, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{
            background: 'var(--surface)', borderRadius: 20, padding: 20, textAlign: 'left',
            border: `1px solid ${colorBg}`, cursor: 'pointer', width: '100%',
            boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} style={{ color }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{sub}</div>}
    </motion.button>
);

const DriverDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOnline, setIsOnline] = useState(false);
    const [position, setPosition] = useState([11.0168, 76.9558]);
    const [driverId, setDriverId] = useState(null);
    const [driverName, setDriverName] = useState('Driver');
    const [debugInfo, setDebugInfo] = useState({ socketConnected: false, socketId: null, lastUpdate: null });
    const [activeRide, setActiveRide] = useState(null);
    const [isPaid, setIsPaid] = useState(false);
    const [routeCoords, setRouteCoords] = useState([]);

    useEffect(() => {
        if (activeRide) {
            const getRoute = async () => {
                try {
                    const startLoc = position;
                    const endLoc = [10.9027, 76.9006];
                    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLoc[1]},${startLoc[0]};${endLoc[1]},${endLoc[0]}?overview=full&geometries=geojson`);
                    const data = await res.json();
                    if (data.routes?.[0]) {
                        // Map lng,lat back to lat,lng
                        setRouteCoords(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
                    }
                } catch (e) { console.warn('Could not fetch OSRM route'); }
            };
            getRoute();
        }
    }, [activeRide]);

    useEffect(() => {
        if (location.state?.rideActive && location.state?.rideId) {
            setActiveRide(location.state);
            setIsOnline(true);
        }
    }, [location]);

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user'));
        if (u) {
            setDriverId(u.id);
            setDriverName(u.username);
        } else {
            // Fallback for testing UI without login
            setDriverId('driver-demo-123');
            setDriverName('Demo Driver');
        }
    }, []);

    useEffect(() => {
        if (!driverId) return;

        if (!socket.connected) socket.connect();

        const handleConnect = () => {
            setDebugInfo(p => ({ ...p, socketConnected: true, socketId: socket.id }));
            socket.emit('join', { room: driverId });
            // Let everyone know this general driver is connected (maybe rider UI needs it initially)
            console.log("Emit active online state", driverId);
        };
        const handleDisconnect = () => setDebugInfo(p => ({ ...p, socketConnected: false }));

        // Listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        if (socket.connected) {
            handleConnect();
        }

        const handleRide = (rideData) => {
            if (isOnline) {
                navigate('/ride-acceptance', { state: { ride: rideData } });
            }
        };

        const handlePaymentCompleted = (data) => {
            setIsPaid(true);
        };

        socket.on('newRideRequest', handleRide);
        socket.on('paymentCompleted', handlePaymentCompleted);

        let interval;
        if (isOnline) {
            updateLocation(position[0], position[1]);
            let step = 0;
            interval = setInterval(() => {
                setPosition(prev => {
                    let newPos = prev;
                    if (activeRide && routeCoords.length > 0) {
                        if (step < routeCoords.length) {
                            newPos = routeCoords[step];
                            step += 3; // Move along the route quickly
                        }
                    } else if (!activeRide) {
                        // Small idle wander if online but no ride
                        newPos = [prev[0] + 0.0001, prev[1] + 0.0001];
                    }
                    updateLocation(newPos[0], newPos[1]);
                    return newPos;
                });
                setDebugInfo(p => ({ ...p, lastUpdate: new Date().toLocaleTimeString() }));
            }, 2000);
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('newRideRequest', handleRide);
            socket.off('paymentCompleted', handlePaymentCompleted);
            if (interval) clearInterval(interval);
        };
    }, [isOnline, driverId, navigate, activeRide, routeCoords]);

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)', overflow: 'hidden' }}>

            {/* Left sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.35 }}
                style={{
                    width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16,
                    padding: 20, background: 'var(--surface)', borderRight: '1px solid var(--border)',
                    boxShadow: '4px 0 24px rgba(91,79,232,0.06)', zIndex: 10, overflowY: 'auto',
                }}
            >
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, position: 'relative' }}>
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
                    <span
                        className="badge badge-primary"
                        style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', scale: 0.85, transformOrigin: 'right center' }}
                    >Driver</span>
                </div>

                {/* Profile */}
                <div style={{ borderRadius: 16, padding: 16, background: 'linear-gradient(135deg,#F3F1FF,#EBF0FF)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#5B4FE8,#8B7CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff' }}>
                            {driverName[0]?.toUpperCase()}
                        </div>
                        <div style={{ position: 'absolute', bottom: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: isOnline ? 'var(--success)' : '#9CA3AF', border: '2.5px solid var(--surface)' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{driverName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                            <Star size={12} style={{ color: '#FACC15', fill: '#FACC15' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>4.89</span>
                            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>· Excellent</span>
                        </div>
                    </div>
                    {/* Toggle */}
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        style={{
                            width: '100%', padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: isOnline ? '#DCFCE7' : 'var(--surface3)',
                            color: isOnline ? '#16A34A' : 'var(--text-4)',
                            outline: isOnline ? '1.5px solid #86EFAC' : '1.5px solid var(--border)',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Power size={14} />
                        {isOnline ? 'Online — Tap to go Offline' : 'Go Online'}
                    </button>
                </div>

                {/* Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'var(--surface3)', border: '1px solid var(--border)' }}>
                    <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>Current Location</p>
                        <p style={{ fontSize: 10, color: 'var(--text-4)' }}>Gandhipuram, Coimbatore</p>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: isOnline ? 'var(--success)' : '#D1D5DB', flexShrink: 0, boxShadow: isOnline ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none' }} />
                </div>

                {/* Quick links / Nav */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                        { label: 'Dashboard Map', path: '/driver', icon: MapPin },
                        { label: 'Earnings', path: '/driver-earnings', icon: TrendingUp },
                        { label: 'Statistics', path: '/driver-stats', icon: BarChart3 },
                        { label: 'Break Scheduler', path: '/break-scheduler', icon: Coffee },
                        { label: 'Expense Tracker', path: '/expense-tracker', icon: Receipt },
                    ].map(({ label, path, icon: Icon }) => {
                        const active = location.pathname === path;
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 12px', borderRadius: 12, border: 'none',
                                    cursor: 'pointer', width: '100%', textAlign: 'left',
                                    background: active ? 'var(--surface2)' : 'transparent',
                                    color: active ? 'var(--primary)' : 'var(--text-3)',
                                    fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13,
                                    transition: 'all 0.15s',
                                    outline: active ? '1.5px solid var(--border2)' : 'none',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface2)'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Icon size={15} style={{ color: active ? 'var(--primary)' : 'var(--text-4)', flexShrink: 0 }} />
                                <span style={{ flex: 1 }}>{label}</span>
                                <ChevronRight size={13} style={{ color: 'var(--border)', flexShrink: 0 }} />
                            </button>
                        );
                    })}
                </nav>

                <div style={{ flex: 1 }} />

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

                {/* Social Media Footer */}
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
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

            {/* Center — Map */}
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={position} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                    <TileLayer attribution='&copy; CartoDB' url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png" opacity={0.75} />
                    <Marker position={position}><Popup>Your Location</Popup></Marker>
                    {activeRide && (
                        <>
                            <Marker position={[10.9027, 76.9006]}><Popup>Rider Pickup</Popup></Marker>
                            {routeCoords.length > 0 ? (
                                <Polyline
                                    positions={routeCoords}
                                    color="#5B4FE8"
                                    weight={5}
                                    opacity={0.8}
                                />
                            ) : (
                                <Polyline
                                    positions={[position, [10.9027, 76.9006]]}
                                    color="#5B4FE8"
                                    weight={5}
                                    opacity={0.8}
                                    dashArray="12,12"
                                />
                            )}
                        </>
                    )}
                </MapContainer>

                {/* Online status banner */}
                <AnimatePresence>
                    {isOnline && (
                        <motion.div
                            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                            style={{
                                position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                                zIndex: 900, padding: '10px 20px', borderRadius: 100,
                                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
                                border: '1px solid #BBF7D0', boxShadow: '0 4px 20px rgba(34,197,94,0.2)',
                                display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font)',
                            }}
                        >
                            <div style={{ position: 'relative', width: 10, height: 10 }}>
                                <div style={{ position: 'absolute', inset: 0, background: 'var(--success)', borderRadius: '50%', animation: 'pulse-ring 1.4s ease-out infinite', opacity: 0.6 }} />
                                <div style={{ width: 10, height: 10, background: 'var(--success)', borderRadius: '50%', position: 'relative', zIndex: 1 }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#16A34A' }}>Looking for rides</span>
                            <span className="badge badge-orange">🔥 2.5x Surge</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active ride card */}
                <AnimatePresence>
                    {activeRide && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                            style={{
                                position: 'absolute', bottom: 24, left: 24, right: 24, zIndex: 900,
                                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
                                borderRadius: 20, padding: 20, border: '1px solid #BBF7D0',
                                boxShadow: '0 12px 40px rgba(34,197,94,0.2)',
                            }}
                        >
                            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#16A34A', marginBottom: 8 }}>🚗 ACTIVE RIDE — Pickup Rider</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
                                Navigating to: <strong>{typeof activeRide?.pickup === 'string' ? activeRide.pickup : 'Pickup Location'}</strong>
                            </p>
                            {!isPaid && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: 16 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                                    <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Waiting for rider to complete payment...</span>
                                </div>
                            )}
                            {isPaid && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: '#DCFCE7', border: '1px solid #BBF7D0', marginBottom: 16 }}>
                                    <span style={{ fontSize: 18 }}>✅</span>
                                    <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 700 }}>Payment Received. En route.</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={async () => {
                                        try {
                                            if (activeRide.rideId) await completeRide(activeRide.rideId);
                                            setActiveRide(null); setIsOnline(true);
                                        } catch { setActiveRide(null); }
                                    }}
                                    className="btn-primary"
                                    style={{ flex: 1, background: 'linear-gradient(135deg,#16A34A,#22C55E)', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' }}
                                >
                                    ✓ Complete Ride
                                </button>
                                <button onClick={() => setActiveRide(null)} className="btn-ghost">Reset</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Offline message */}
                {!isOnline && !activeRide && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, pointerEvents: 'none' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', borderRadius: 24, padding: 36, textAlign: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', pointerEvents: 'all' }}
                        >
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🚘</div>
                            <h2 style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-1)', marginBottom: 6 }}>You're Offline</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Toggle the switch in the sidebar to start accepting rides.</p>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Right — Stats panel */}
            <motion.aside
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.35 }}
                style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: 20, background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: '-4px 0 24px rgba(91,79,232,0.06)', overflowY: 'auto', zIndex: 10 }}
            >
                <p className="section-label" style={{ marginBottom: 4 }}>Today's Summary</p>

                <Stat label="Earnings" value="₹1,450" sub="18 rides completed" color="#16A34A" colorBg="#F0FDF4" icon={TrendingUp} onClick={() => navigate('/driver-earnings')} />
                <Stat label="Rating" value="4.89 ★" sub="Excellent performance" color="#D97706" colorBg="#FFFBEB" icon={BarChart3} onClick={() => navigate('/driver-stats')} />

                <div className="divider" style={{ margin: '4px 0' }} />
                <p className="section-label">Quick Actions</p>

                {[
                    { label: 'Break Scheduler', sub: 'Plan your breaks', icon: Coffee, path: '/break-scheduler', color: '#5B4FE8', colorBg: '#F3F1FF' },
                    { label: 'Expense Tracker', sub: 'Log fuel & costs', icon: Receipt, path: '/expense-tracker', color: '#EA580C', colorBg: '#FFF7ED' },
                ].map(({ label, sub, icon: Icon, path, color, colorBg }) => (
                    <button
                        key={path}
                        onClick={() => navigate(path)}
                        className="card-hover"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface3)', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface3)'}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={16} style={{ color }} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>{label}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-4)' }}>{sub}</p>
                        </div>
                    </button>
                ))}

                {/* Debug info (smaller, tucked) */}
                <div className="divider" style={{ margin: '4px 0' }} />
                <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface3)', fontSize: 11, color: 'var(--text-4)', lineHeight: 1.7 }}>
                    <p style={{ fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Connection Status</p>
                    <p>Socket: <span style={{ color: debugInfo.socketConnected ? '#16A34A' : 'var(--danger)', fontWeight: 600 }}>{debugInfo.socketConnected ? '● Connected' : '○ Disconnected'}</span></p>
                    <p>Last heartbeat: {debugInfo.lastUpdate || '—'}</p>
                    <p>Driver ID: {driverId || '—'}</p>
                </div>
            </motion.aside>
        </div >
    );
};

export default DriverDashboard;
