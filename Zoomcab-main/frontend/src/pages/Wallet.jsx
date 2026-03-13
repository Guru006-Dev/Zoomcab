import { motion } from 'framer-motion';
import { Plus, ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const transactions = [
    { id: 1, label: 'Auto Ride — Office', type: 'debit', amount: 65, date: 'Today, 10:30 AM' },
    { id: 2, label: 'Wallet Top-up', type: 'credit', amount: 500, date: 'Yesterday, 6:00 PM' },
    { id: 3, label: 'Sedan Ride — Mall', type: 'debit', amount: 145, date: 'Feb 10, 3:00 PM' },
    { id: 4, label: 'Referral Bonus', type: 'credit', amount: 50, date: 'Feb 8, 11:00 AM' },
    { id: 5, label: 'SUV Ride — Airport', type: 'debit', amount: 220, date: 'Feb 5, 9:00 AM' },
];

export default function Wallet() {
    return (
        <PageLayout title="Wallet" subtitle="Manage your ZoomCab balance">
            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Balance card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                        borderRadius: 24, padding: 28,
                        background: 'linear-gradient(135deg,#5B4FE8,#8B7CF6)',
                        color: '#fff', boxShadow: '0 16px 48px rgba(91,79,232,0.35)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.8, marginBottom: 8 }}>
                        <Zap size={14} />
                        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>ZOOMCAB WALLET</span>
                    </div>
                    <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>Available Balance</p>
                    <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>₹1,250.00</h2>

                    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                        <button style={{
                            flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.2)', color: '#fff',
                            fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            backdropFilter: 'blur(8px)', transition: 'background 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            <Plus size={15} /> Add Money
                        </button>
                        <button style={{
                            flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                            background: 'transparent', color: '#fff',
                            fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'background 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            History
                        </button>
                    </div>
                </motion.div>

                {/* Transactions */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <p className="section-label">Recent Transactions</p>
                    </div>
                    {transactions.map((tx, i) => (
                        <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 20px',
                                borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none',
                            }}
                        >
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                background: tx.type === 'credit' ? '#F0FDF4' : '#FEF2F2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {tx.type === 'credit'
                                    ? <ArrowDownLeft size={16} style={{ color: '#16A34A' }} />
                                    : <ArrowUpRight size={16} style={{ color: '#DC2626' }} />
                                }
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{tx.label}</p>
                                <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{tx.date}</p>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: tx.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                                {tx.type === 'credit' ? '+' : '−'}₹{tx.amount}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </PageLayout>
    );
}
