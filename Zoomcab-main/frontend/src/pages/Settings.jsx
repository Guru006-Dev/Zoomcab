import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, HelpCircle, ChevronRight, Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ThemeToggle from '../components/ThemeToggle';

export default function Settings() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const Toggle = ({ on, onToggle }) => (
        <button
            onClick={onToggle}
            style={{
                width: 44, height: 24, borderRadius: 12, padding: 3,
                background: on ? 'var(--primary)' : 'var(--surface3)',
                border: on ? 'none' : '1px solid var(--border)',
                cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                flexShrink: 0,
            }}
        >
            <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, transition: 'left 0.2s',
                left: on ? 'calc(100% - 21px)' : 3,
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
        </button>
    );

    const sections = [
        {
            title: 'Preferences',
            items: [
                { icon: Bell, label: 'Push Notifications', sub: 'Ride updates & offers', toggle: true, state: notifications, handler: () => setNotifications(v => !v) },
                { icon: Moon, label: 'Dark Mode', sub: 'Switch to dark theme', toggle: true, state: darkMode, handler: () => { document.body.classList.toggle('dark'); setDarkMode(v => !v); } },
            ]
        },
        {
            title: 'Account',
            items: [
                { icon: Shield, label: 'Privacy & Security', sub: 'Manage your data' },
                { icon: HelpCircle, label: 'Help & Support', sub: '24×7 assistance' },
            ]
        }
    ];

    return (
        <PageLayout title="Settings" subtitle="Customize your experience">
            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {sections.map(({ title, items }) => (
                    <div key={title}>
                        <p className="section-label" style={{ marginBottom: 10, paddingLeft: 4 }}>{title}</p>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {items.map(({ icon: Icon, label, sub, toggle, state, handler }, i) => (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    onClick={handler}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                                        borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                                        cursor: handler ? 'pointer' : 'default',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => handler && (e.currentTarget.style.background = 'var(--surface3)')}
                                    onMouseLeave={e => handler && (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={16} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{label}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{sub}</p>
                                    </div>
                                    {toggle
                                        ? (label === 'Dark Mode' ? <ThemeToggle on={state} onToggle={e => { e.stopPropagation(); handler(); }} /> : <Toggle on={state} onToggle={e => { e.stopPropagation(); handler(); }} />)
                                        : <ChevronRight size={16} style={{ color: 'var(--text-4)' }} />
                                    }
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Logout */}
                <button
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
                        borderRadius: 16, border: '1px solid #FECACA', background: '#FEF2F2',
                        cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 14, color: '#DC2626',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                >
                    <LogOut size={16} />
                    Sign Out of ZoomCab
                </button>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)' }}>
                    ZoomCab v2.4.0 · 2025
                </p>
            </div>
        </PageLayout>
    );
}
