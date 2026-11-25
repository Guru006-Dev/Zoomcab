import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, House as Home, Wallet, ClockCounterClockwise as History, Gear as Settings, UserPlus, Medal as Award, Shield, TrendUp as TrendingUp, CaretRight as ChevronRight, Car, MapPin, ChartBar as BarChart3, Coffee, Receipt, Wind, Sparkle as Sparkles } from '@phosphor-icons/react';
import Brand from './Brand';

const riderNavItems = [
    { label: 'Home', icon: Home, path: '/home' },
    { label: 'Wallet', icon: Wallet, path: '/wallet' },
    { label: 'My Rides', icon: History, path: '/rides' },
    { label: 'Payment', icon: TrendingUp, path: '/payment' },
    { label: 'Rewards', icon: Award, path: '/rewards' },
    { label: 'Ride Setup', icon: Wind, path: '/ride-preferences' },
    { label: 'AI Concierge', icon: Sparkles, path: '/concierge', special: true },
    { label: 'Settings', icon: Settings, path: '/settings' },
];

const driverNavItems = [
    { label: 'Dashboard Map', path: '/driver', icon: MapPin },
    { label: 'Earnings', path: '/driver-earnings', icon: TrendingUp },
    { label: 'Statistics', path: '/driver-stats', icon: BarChart3 },
    { label: 'Break Scheduler', path: '/break-scheduler', icon: Coffee },
    { label: 'Expense Tracker', path: '/expense-tracker', icon: Receipt },
];

/**
 * Shared layout wrapper for all sub-pages.
 * Props:
 *   title        – page heading
 *   subtitle     – optional subheading
 *   children     – page body
 *   headerRight  – optional JSX shown in top-right of header
 *   noPad        – skip inner padding (for full-bleed content)
 */
export default function PageLayout({ title, subtitle, children, headerRight, noPad = false, sample = false }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Ensure we capture "Guru One" correctly whether it's stored in user.username, user.name, or a flat 'name' / 'username'
    const username = user?.username || user?.name || localStorage.getItem('username') || localStorage.getItem('name') || 'Rider';

    // Determine whether to show driver or rider layout based on the current page,
    // solving the issue where shared localStorage makes rider pages look like driver pages.
    const isDriverPage = ['/driver', '/driver-earnings', '/driver-stats', '/break-scheduler', '/expense-tracker'].includes(pathname);
    const navItems = isDriverPage ? driverNavItems : riderNavItems;
    const displayRole = isDriverPage ? 'driver' : 'rider';

    return (
        <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>

            {/* ── Sidebar ── */}
            <motion.aside className="app-side"
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
                <div data-side-extra style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, flexDirection: 'column', gap: 6 }}>
                    <Brand />
                    {displayRole === 'driver' && (
                        <span
                            className="badge badge-primary"
                            style={{ scale: 0.85 }}
                        >Driver</span>
                    )}
                </div>

                {/* Avatar */}
                <div data-side-extra style={{
                    borderRadius: 16, padding: 16, textAlign: 'center',
                    background: 'var(--surface2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, fontWeight: 600, color: '#fff',
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
                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{username}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{displayRole === 'driver' ? 'Driver' : 'Rider'}</p>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {navItems.map(({ label, icon: Icon, path, badge, special }) => {
                        const active = pathname === path;
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 12px', borderRadius: 12, border: 'none',
                                    cursor: 'pointer', width: '100%', textAlign: 'left',
                                    background: active ? (special ? 'var(--surface2)' : 'var(--surface2)') : 'transparent',
                                    color: active ? 'var(--primary-text)' : 'var(--text-3)',
                                    fontFamily: 'var(--font)', fontWeight: special ? 700 : 600, fontSize: 13,
                                    transition: 'all 0.15s',
                                    outline: active ? (special ? '1.5px solid #8B7CF6' : '1.5px solid var(--border2)') : 'none',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface2)'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Icon size={15} style={{ color: special ? 'var(--primary-text)' : (active ? 'var(--primary-text)' : 'var(--text-4)'), flexShrink: 0 }} />
                                <span style={{ flex: 1, color: special ? 'var(--primary-text)' : 'inherit' }}>{label}</span>
                                {badge && <span className="badge badge-orange">{badge}</span>}
                                {!special && <ChevronRight size={13} style={{ color: 'var(--border)', flexShrink: 0 }} />}
                            </button>
                        );
                    })}
                </nav>

                {/* Safety */}
                <button
                    onClick={() => navigate('/home')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 14px', borderRadius: 12,
                        background: 'rgba(61,220,132,0.14)', color: 'var(--success)',
                        border: '1px solid rgba(61,220,132,0.4)', cursor: 'pointer',
                        fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13,
                    }}
                >
                    <Shield size={15} />
                    Safety & SOS
                </button>

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

            {/* ── Main ── */}
            <main className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Top bar */}
                <div className="app-top" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 28px', background: 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                    boxShadow: '0 1px 4px rgba(91,79,232,0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'var(--surface3)', border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface3)'}
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 style={{ fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{title}</h1>
                            {subtitle && <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{subtitle}</p>}
                        </div>
                    </div>
                    {sample && <span className="badge badge-warning">Sample data</span>}
                    {headerRight && <div>{headerRight}</div>}
                </div>

                {/* Content */}
                <motion.div className="app-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ flex: 1, overflowY: 'auto', padding: noPad ? 0 : '28px' }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
