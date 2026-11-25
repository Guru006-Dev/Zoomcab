import { useState, useEffect } from 'react';
import { socket, updateLocation, completeRide, joinRealtime, getDriverRating } from '../api';
import { MapContainer, Marker, Popup, Polyline } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, TrendUp as TrendingUp, ChartBar as BarChart3, Coffee, Receipt, MapPin, Star, CaretRight as ChevronRight } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import Brand from '../components/Brand';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import MapTiles from '../components/MapTiles';
import { CheckCircle, Car } from '@phosphor-icons/react';

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
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{sub}</div>}
    </motion.button>
);

const DriverDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Arriving from RideAcceptance with an accepted ride: start online with that ride active.
    // (The route remounts this page, so reading location.state once is enough.)
    const arrivedWithRide = Boolean(location.state?.rideActive && location.state?.rideId);
    const [isOnline, setIsOnline] = useState(arrivedWithRide);
    const [position, setPosition] = useState([11.0168, 76.9558]);
    // Logged-in driver from localStorage, or a demo identity for trying the UI without login.
    const [{ driverId, driverName }] = useState(() => {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        return u ? { driverId: u.id, driverName: u.username } : { driverId: 'driver-demo-123', driverName: 'Demo Driver' };
    });
    const [debugInfo, setDebugInfo] = useState({ socketConnected: false, socketId: null, lastUpdate: null });
    const [activeRide, setActiveRide] = useState(arrivedWithRide ? location.state : null);
    const [isPaid, setIsPaid] = useState(false);
    const [routeCoords, setRouteCoords] = useState([]);
    const [rating, setRating] = useState(null);
    const ratingText = rating?.totalReviews ? `${rating.averageRating}  stars` : '—';

    useEffect(() => {
        getDriverRating(driverId).then(res => setRating(res.data.stats)).catch(() => { /* no rating to show */ });
    }, [driverId]);

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
        if (!driverId) return;

        if (!socket.connected) socket.connect();

        const handleConnect = () => {
            setDebugInfo(p => ({ ...p, socketConnected: true, socketId: socket.id }));
            joinRealtime();
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

        const handlePaymentCompleted = () => {
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
        <div className="app-shell" style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)', overflow: 'hidden' }}>

            {/* Left sidebar */}
            <motion.aside className="app-side"
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.35 }}
                style={{
                    width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16,
                    padding: 20, background: 'var(--surface)', borderRight: '1px solid var(--border)',
                    boxShadow: '4px 0 24px rgba(91,79,232,0.06)', zIndex: 10, overflowY: 'auto',
                }}
            >
                {/* Brand */}
                <div data-side-extra style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, flexDirection: 'column', gap: 6 }}>
                    <Brand />
                    <span
                        className="badge badge-primary"
                        style={{ scale: 0.85 }}
                    >Driver</span>
                </div>

                {/* Profile */}
                <div className="driver-profile" style={{ borderRadius: 16, padding: 16, background: 'var(--surface2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600, color: '#fff' }}>
                            {driverName[0]?.toUpperCase()}
                        </div>
                        <div style={{ position: 'absolute', bottom: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: isOnline ? 'var(--success)' : '#9CA3AF', border: '2.5px solid var(--surface)' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{driverName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                            <Star size={12} style={{ color: '#FACC15', fill: '#FACC15' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{ratingText}</span>
                        </div>
                    </div>
                    {/* Toggle */}
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        style={{
                            width: '100%', padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: isOnline ? 'rgba(61,220,132,0.14)' : 'var(--surface3)',
                            color: isOnline ? 'var(--success)' : 'var(--text-4)',
                            outline: isOnline ? '1.5px solid rgba(61,220,132,0.4)' : '1.5px solid var(--border)',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Power size={14} />
                        {isOnline ? 'Online — Tap to go Offline' : 'Go Online'}
                    </button>
                </div>

                {/* Location */}
                <div data-side-extra style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'var(--surface3)', border: '1px solid var(--border)' }}>
                    <MapPin size={14} style={{ color: 'var(--primary-text)', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>Current Location</p>
                        <p style={{ fontSize: 10, color: 'var(--text-4)' }}>Gandhipuram, Coimbatore</p>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: isOnline ? 'var(--success)' : 'var(--surface2)', flexShrink: 0, boxShadow: isOnline ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none' }} />
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
                                    color: active ? 'var(--primary-text)' : 'var(--text-3)',
                                    fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13,
                                    transition: 'all 0.15s',
                                    outline: active ? '1.5px solid var(--border2)' : 'none',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface2)'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Icon size={15} style={{ color: active ? 'var(--primary-text)' : 'var(--text-4)', flexShrink: 0 }} />
                                <span style={{ flex: 1 }}>{label}</span>
                                <ChevronRight size={13} style={{ color: 'var(--border)', flexShrink: 0 }} />
                            </button>
                        );
                    })}
                </nav>

                <div style={{ flex: 1 }} />

                {/* Logout */}
                <button
                    onClick={() => { localStorage.clear(); navigate('/login'); }}
                    style={{
                        fontSize: 12, color: 'var(--text-4)', background: 'none',
                        border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                        textAlign: 'left', padding: '4px 0',
                    }}
                >
                    Sign out →
                </button>


            </motion.aside>

            {/* Center — Map */}
            <div className="app-map" style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={position} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <MapTiles />
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
                                background: 'var(--surface)', backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(61,220,132,0.4)', boxShadow: '0 4px 20px rgba(34,197,94,0.2)',
                                display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font)',
                            }}
                        >
                            <div style={{ position: 'relative', width: 10, height: 10 }}>
                                <div style={{ position: 'absolute', inset: 0, background: 'var(--success)', borderRadius: '50%', animation: 'pulse-ring 1.4s ease-out infinite', opacity: 0.6 }} />
                                <div style={{ width: 10, height: 10, background: 'var(--success)', borderRadius: '50%', position: 'relative', zIndex: 1 }} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--success)' }}>Looking for rides</span>
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
                                background: 'var(--surface)', backdropFilter: 'blur(16px)',
                                borderRadius: 20, padding: 20, border: '1px solid rgba(61,220,132,0.4)',
                                boxShadow: '0 12px 40px rgba(34,197,94,0.2)',
                            }}
                        >
                            <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--success)', marginBottom: 8 }}>Active ride: pick up your rider</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
                                Navigating to: <strong>{typeof activeRide?.pickup === 'string' ? activeRide.pickup : 'Pickup Location'}</strong>
                            </p>
                            {!isPaid && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: 16 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                                    <span style={{ fontSize: 13, color: 'var(--primary-text)', fontWeight: 600 }}>Waiting for rider to complete payment...</span>
                                </div>
                            )}
                            {isPaid && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(61,220,132,0.14)', border: '1px solid rgba(61,220,132,0.4)', marginBottom: 16 }}>
                                    <CheckCircle size={18} weight="fill" />
                                    <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Payment Received. En route.</span>
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
                                    style={{ flex: 1, background: '#15803d', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' }}
                                >
                                    Complete ride
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
                            style={{ background: 'var(--surface)', backdropFilter: 'blur(16px)', borderRadius: 24, padding: 36, textAlign: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', pointerEvents: 'all' }}
                        >
                            <Car size={48} weight="duotone" style={{ marginBottom: 12 }} />
                            <h2 style={{ fontWeight: 600, fontSize: 20, color: 'var(--text-1)', marginBottom: 6 }}>You're Offline</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Tap Go Online to start accepting rides.</p>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Right — Stats panel */}
            <motion.aside className="app-panel"
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.35 }}
                style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: 20, background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: '-4px 0 24px rgba(91,79,232,0.06)', overflowY: 'auto', zIndex: 10 }}
            >
                <p className="section-label" style={{ marginBottom: 4 }}>Summary</p>

                <Stat label="Earnings" value="View" sub="Sample data for now" color="#16A34A" colorBg="rgba(61,220,132,0.14)" icon={TrendingUp} onClick={() => navigate('/driver-earnings')} />
                <Stat label="Rating" value={ratingText} sub={rating?.totalReviews ? `${rating.totalReviews} review${rating.totalReviews === 1 ? '' : 's'}` : 'No reviews yet'} color="#D97706" colorBg="rgba(251,191,36,0.14)" icon={BarChart3} onClick={() => navigate('/driver-stats')} />

                <div className="divider" style={{ margin: '4px 0' }} />
                <p className="section-label">Quick Actions</p>

                {[
                    { label: 'Break Scheduler', sub: 'Plan your breaks', icon: Coffee, path: '/break-scheduler', color: 'var(--primary-text)', colorBg: 'rgba(139,130,255,0.16)' },
                    { label: 'Expense Tracker', sub: 'Log fuel & costs', icon: Receipt, path: '/expense-tracker', color: 'var(--warning)', colorBg: 'rgba(251,146,60,0.14)' },
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
                            <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{label}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-4)' }}>{sub}</p>
                        </div>
                    </button>
                ))}

                {/* Debug info (smaller, tucked) */}
                <div className="divider" style={{ margin: '4px 0' }} />
                <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface3)', fontSize: 11, color: 'var(--text-4)', lineHeight: 1.7 }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>Connection Status</p>
                    <p>Socket: <span style={{ color: debugInfo.socketConnected ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{debugInfo.socketConnected ? '● Connected' : '○ Disconnected'}</span></p>
                    <p>Last heartbeat: {debugInfo.lastUpdate || '—'}</p>
                    <p>Driver ID: {driverId || '—'}</p>
                </div>
            </motion.aside>
        </div>
    );
};

export default DriverDashboard;
