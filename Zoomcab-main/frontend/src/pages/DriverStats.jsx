import { motion } from 'framer-motion';
import { Star, TrendingUp, CheckCircle, XCircle, MapPin, Award, Trophy } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const stats = { rating: 4.89, ratingTrend: '+0.12', acceptanceRate: 94, cancellationRate: 2, totalDistance: 3542, totalRides: 520, onTimePercent: 97 };
const badges = [
    { id: 1, name: '5-Star Pro', icon: '⭐', desc: 'Maintain 5.0 for 50 rides', unlocked: true },
    { id: 2, name: 'Night Owl', icon: '🌙', desc: 'Complete 100 night rides', unlocked: true },
    { id: 3, name: 'Speed Demon', icon: '⚡', desc: 'Complete 10 rides in a day', unlocked: true },
    { id: 4, name: 'Road Warrior', icon: '🏆', desc: 'Drive 5000 km', unlocked: false, progress: 71 },
    { id: 5, name: 'Fav Driver', icon: '💝', desc: '100 five-star ratings', unlocked: false, progress: 82 },
    { id: 6, name: 'Legend', icon: '👑', desc: 'Complete 1000 rides', unlocked: false, progress: 52 },
];
const trendData = [4.7, 4.75, 4.8, 4.78, 4.82, 4.85, 4.88, 4.87, 4.89, 4.91, 4.89, 4.92, 4.9, 4.89];
const maxR = 5.0, minR = 4.5;

export default function DriverStats() {
    return (
        <PageLayout title="Driver Stats" subtitle="Your performance overview">
            <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Rating hero */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    style={{ borderRadius: 24, padding: 28, background: 'linear-gradient(135deg,#D97706,#F59E0B)', color: '#fff', textAlign: 'center', boxShadow: '0 16px 48px rgba(217,119,6,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.85, marginBottom: 8 }}>
                        <Star size={14} style={{ fill: '#fff' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>YOUR RATING</span>
                    </div>
                    <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{stats.rating}</div>
                    <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>{stats.ratingTrend} this month</div>
                </motion.div>

                {/* Trend chart */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>Rating Trend (30 Days)</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                        {trendData.map((r, i) => (
                            <motion.div key={i}
                                initial={{ height: 0 }} animate={{ height: `${((r - minR) / (maxR - minR)) * 100}%` }} transition={{ delay: i * 0.04 }}
                                style={{ flex: 1, background: 'linear-gradient(180deg,#D97706,#F59E0B)', borderRadius: '4px 4px 0 0', minWidth: 6 }}
                                title={r.toString()} />
                        ))}
                    </div>
                </div>

                {/* Metrics grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                        { icon: CheckCircle, label: 'Acceptance Rate', value: `${stats.acceptanceRate}%`, color: 'var(--success)', bg: '#F0FDF4' },
                        { icon: XCircle, label: 'Cancellation Rate', value: `${stats.cancellationRate}%`, color: 'var(--danger)', bg: '#FEF2F2' },
                        { icon: MapPin, label: 'KM Driven', value: stats.totalDistance, color: 'var(--primary)', bg: 'var(--surface2)' },
                        { icon: Award, label: 'On-Time Pickup', value: `${stats.onTimePercent}%`, color: '#7C3AED', bg: '#F5F3FF' },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label} className="card" style={{ padding: 20, textAlign: 'center' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                <Icon size={18} style={{ color }} />
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 26, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{value}</div>
                            <div className="section-label" style={{ marginTop: 4 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Achievements */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Trophy size={14} style={{ color: '#D97706' }} />
                        <p className="section-label">Achievements</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {badges.map((b, i) => (
                            <motion.div key={b.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                                className="card" style={{ padding: 16, textAlign: 'center', opacity: b.unlocked ? 1 : 0.55, outline: b.unlocked ? '1.5px solid rgba(217,119,6,0.3)' : 'none' }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>{b.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-1)', marginBottom: 4 }}>{b.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-4)', lineHeight: 1.4 }}>{b.desc}</div>
                                {!b.unlocked && b.progress && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${b.progress}%`, background: 'linear-gradient(90deg,var(--primary),#8B7CF6)', borderRadius: 4 }} />
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 3 }}>{b.progress}%</div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
