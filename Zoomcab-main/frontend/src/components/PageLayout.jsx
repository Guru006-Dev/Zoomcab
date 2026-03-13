import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Home, Wallet, History, Settings,
    UserPlus, Award, Shield, TrendingUp,
    ChevronRight, Car, Facebook, Twitter, Instagram, Github,
    MapPin, BarChart3, Coffee, Receipt, Wind, Sparkles
} from 'lucide-react';
import ZoomcabLogo from '../assets/ChatGPT Image Feb 21, 2026, 09_27_37 PM.png';
import { SocialTooltip } from './ui/social-media';

const riderNavItems = [
    { label: 'Home', icon: Home, path: '/home' },
    { label: 'Wallet', icon: Wallet, path: '/wallet', badge: '₹240' },
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
export default function PageLayout({ title, subtitle, children, headerRight, noPad = false }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Ensure we capture "Guru One" correctly whether it's stored in user.username, user.name, or a flat 'name' / 'username'
    const username = user?.username || user?.name || localStorage.getItem('username') || localStorage.getItem('name') || 'Rider';
    const role = localStorage.getItem('role') || 'rider';

    // Determine whether to show driver or rider layout based on the current page,
    // solving the issue where shared localStorage makes rider pages look like driver pages.
    const isDriverPage = ['/driver', '/driver-earnings', '/driver-stats', '/break-scheduler', '/expense-tracker'].includes(pathname);
    const navItems = isDriverPage ? driverNavItems : riderNavItems;
    const displayRole = isDriverPage ? 'driver' : 'rider';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>

            {/* ── Sidebar ── */}
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
                    {displayRole === 'driver' && (
                        <span
                            className="badge badge-primary"
                            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', scale: 0.85, transformOrigin: 'right center' }}
                        >Driver</span>
                    )}
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
                        <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{displayRole === 'driver' ? 'Active Driver' : 'Premium Rider'}</p>
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
                    onClick={() => navigate('/home')}
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

            {/* ── Main ── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Top bar */}
                <div style={{
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
                            <h1 style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{title}</h1>
                            {subtitle && <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{subtitle}</p>}
                        </div>
                    </div>
                    {headerRight && <div>{headerRight}</div>}
                </div>

                {/* Content */}
                <motion.div
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
