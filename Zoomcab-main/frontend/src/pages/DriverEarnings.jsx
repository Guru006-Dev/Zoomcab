import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, IndianRupee, Clock } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const earningsData = {
    daily: { total: 1450, rides: 18, tips: 150, surge: 200, bonus: 100 },
    weekly: { total: 9800, rides: 124, tips: 980, surge: 1400, bonus: 500 },
    monthly: { total: 42500, rides: 520, tips: 4200, surge: 6000, bonus: 2300 },
};
const graphData = {
    daily: [120, 180, 220, 150, 190, 240, 180, 200, 150, 170, 210, 190, 220, 180, 160, 200, 180, 150],
    weekly: [1200, 1400, 1500, 1300, 1600, 1450, 1350],
    monthly: [8500, 9200, 10500, 9800, 11200, 10800, 9500, 10200, 11500, 12000],
};

export default function DriverEarnings() {
    const [period, setPeriod] = useState('daily');
    const data = earningsData[period];
    const graph = graphData[period];
    const max = Math.max(...graph);
    const goal = 2000;
    const progress = Math.min((data.total / goal) * 100, 100);

    return (
        <PageLayout title="Earnings" subtitle="Your driver earnings summary">
            <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Period selector */}
                <div style={{ display: 'flex', gap: 8 }}>
                    {['daily', 'weekly', 'monthly'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                            style={{
                                flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
                                fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13, textTransform: 'capitalize',
                                background: period === p ? 'var(--primary)' : 'var(--surface)',
                                color: period === p ? '#fff' : 'var(--text-3)',
                                boxShadow: period === p ? '0 4px 16px rgba(91,79,232,0.3)' : 'none',
                                border: period === p ? 'none' : '1px solid var(--border)',
                                transition: 'all 0.2s',
                            }}>
                            {p}
                        </button>
                    ))}
                </div>

                {/* Total */}
                <motion.div key={period} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ borderRadius: 24, padding: 28, background: 'linear-gradient(135deg,#16A34A,#22C55E)', color: '#fff', textAlign: 'center', boxShadow: '0 16px 48px rgba(22,163,74,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.85, marginBottom: 8 }}>
                        <IndianRupee size={14} />
                        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>TOTAL EARNINGS</span>
                    </div>
                    <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>₹{data.total.toLocaleString()}</div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>{data.rides} rides completed</div>
                </motion.div>

                {/* Goal (daily only) */}
                {period === 'daily' && (
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Target size={15} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>Daily Goal</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-3)' }}>₹{goal} target</span>
                        </div>
                        <div style={{ height: 10, background: 'var(--surface3)', borderRadius: 10, overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }}
                                style={{ height: '100%', borderRadius: 10, background: 'linear-gradient(90deg,var(--primary),#8B7CF6)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                            <span style={{ color: 'var(--text-4)' }}>{Math.round(progress)}% complete</span>
                            {data.total < goal
                                ? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{goal - data.total} to go</span>
                                : <span style={{ color: 'var(--success)', fontWeight: 700 }}>🎉 Goal achieved!</span>
                            }
                        </div>
                    </div>
                )}

                {/* Chart */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <TrendingUp size={15} style={{ color: 'var(--primary)' }} />
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>Earnings Trend</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
                        {graph.map((v, i) => (
                            <motion.div key={i}
                                initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }} transition={{ delay: i * 0.03 }}
                                style={{ flex: 1, background: 'linear-gradient(180deg,var(--primary),#8B7CF6)', borderRadius: '4px 4px 0 0', minWidth: 4 }}
                                title={`₹${v}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Breakdown */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <p className="section-label">Breakdown</p>
                    </div>
                    {[
                        { label: 'Base Fare', value: data.total - data.tips - data.surge - data.bonus, color: 'var(--text-1)' },
                        { label: 'Tips', value: `+${data.tips}`, color: 'var(--success)' },
                        { label: 'Surge', value: `+${data.surge}`, color: 'var(--orange)' },
                        { label: 'Bonuses', value: `+${data.bonus}`, color: 'var(--primary)' },
                    ].map((row, i, arr) => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{row.label}</span>
                            <span style={{ fontWeight: 700, fontSize: 15, color: row.color }}>₹{row.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                {/* Peak hours */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <Clock size={15} style={{ color: 'var(--warning)' }} />
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>Peak Hours Today</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {['8–10 AM', '1–3 PM', '6–9 PM'].map(t => (
                            <div key={t} style={{ padding: 12, borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A', textAlign: 'center' }}>
                                <div style={{ fontSize: 20, marginBottom: 4 }}>🔥</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706' }}>{t}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
