import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, CheckCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const breakTypes = [
    { id: 'short', name: 'Short Break', duration: 15, icon: '☕' },
    { id: 'lunch', name: 'Lunch Break', duration: 30, icon: '🍽️' },
    { id: 'long', name: 'Long Break', duration: 60, icon: '🛌' },
];
const scheduled = [
    { id: 1, type: 'lunch', time: '01:00 PM', duration: '30 min', status: 'completed' },
    { id: 2, type: 'short', time: '04:00 PM', duration: '15 min', status: 'upcoming' },
];

export default function BreakScheduler() {
    const [onBreak, setOnBreak] = useState(false);
    const [breakType, setBreakType] = useState('short');

    return (
        <PageLayout title="Break Scheduler" subtitle="Manage your shift breaks">
            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Status hero */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                        borderRadius: 24, padding: 28, textAlign: 'center', color: '#fff',
                        background: onBreak ? 'linear-gradient(135deg,#D97706,#F97316)' : 'linear-gradient(135deg,#16A34A,#22C55E)',
                        boxShadow: onBreak ? '0 16px 48px rgba(217,119,6,0.35)' : '0 16px 48px rgba(22,163,74,0.35)'
                    }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{onBreak ? '☕' : '🚗'}</div>
                    <h2 style={{ fontWeight: 800, fontSize: 22 }}>{onBreak ? 'On Break' : 'Available for Rides'}</h2>
                    <p style={{ fontSize: 13, opacity: 0.85, marginTop: 4, marginBottom: 20 }}>
                        {onBreak ? 'Riders cannot see you during break' : 'You are visible to riders'}
                    </p>
                    <button onClick={() => setOnBreak(v => !v)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 14, border: 'none', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.25)', color: '#fff', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 14, backdropFilter: 'blur(8px)'
                        }}>
                        {onBreak ? <><Play size={16} /> End Break</> : <><Pause size={16} /> Start Break</>}
                    </button>
                </motion.div>

                {/* Break type selector */}
                <div className="card" style={{ padding: 20 }}>
                    <p className="section-label" style={{ marginBottom: 12 }}>Select Break Type</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {breakTypes.map(t => (
                            <button key={t.id} onClick={() => setBreakType(t.id)}
                                style={{
                                    padding: 14, borderRadius: 14, border: `1.5px solid ${breakType === t.id ? 'var(--primary)' : 'var(--border)'}`,
                                    background: breakType === t.id ? 'var(--surface2)' : 'var(--surface3)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                }}>
                                <div style={{ fontSize: 26, marginBottom: 6 }}>{t.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-1)' }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{t.duration} min</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Today's schedule */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <p className="section-label">Today's Schedule</p>
                    </div>
                    {scheduled.map((b, i) => (
                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < scheduled.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Clock size={16} style={{ color: 'var(--primary)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)', textTransform: 'capitalize' }}>{b.type} Break</p>
                                <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{b.time} · {b.duration}</p>
                            </div>
                            {b.status === 'completed'
                                ? <span className="badge badge-success"><CheckCircle size={12} /> Done</span>
                                : <span className="badge" style={{ background: '#FEF9C3', color: '#854D0E', border: '1px solid #FDE68A' }}>Upcoming</span>
                            }
                        </div>
                    ))}
                </div>

                {/* Stats */}
                <div className="card" style={{ padding: 20 }}>
                    <p className="section-label" style={{ marginBottom: 14 }}>Break Stats Today</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        {[{ label: 'Total Break', val: '45m', color: 'var(--primary)' }, { label: 'Breaks Taken', val: '2', color: 'var(--orange)' }, { label: 'Active Time', val: '7h 15m', color: 'var(--success)' }].map(s => (
                            <div key={s.label} style={{ textAlign: 'center', padding: 12, borderRadius: 12, background: 'var(--surface3)' }}>
                                <div style={{ fontWeight: 800, fontSize: 20, color: s.color }}>{s.val}</div>
                                <div className="section-label" style={{ marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
