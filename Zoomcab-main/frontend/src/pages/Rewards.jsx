import { motion } from 'framer-motion';
import { Gift, TrendingUp, Award, Sparkles } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import useRewards from '../hooks/useRewards';

export default function Rewards() {
    const { points, history, redeemPoints, availableRewards } = useRewards();

    const handleRedeem = (rewardId) => {
        const ok = redeemPoints(rewardId);
        alert(ok ? '🎉 Reward redeemed!' : '❌ Not enough points.');
    };

    return (
        <PageLayout title="Rewards" subtitle="Earn points on every ride">
            <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Points hero */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    style={{ borderRadius: 24, padding: 32, textAlign: 'center', background: 'linear-gradient(135deg,#5B4FE8,#8B7CF6)', color: '#fff', boxShadow: '0 16px 48px rgba(91,79,232,0.35)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.85, marginBottom: 8 }}>
                        <Sparkles size={14} />
                        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>YOUR POINTS</span>
                    </div>
                    <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{points.toLocaleString()}</div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>Earn 1 point for every ₹10 spent</div>
                </motion.div>

                {/* Available rewards */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Gift size={15} style={{ color: 'var(--primary)' }} />
                        <p className="section-label">Available Rewards</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {availableRewards.map((reward, i) => (
                            <motion.div
                                key={reward.id}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                className="card"
                                style={{ padding: 20, textAlign: 'center', opacity: reward.canRedeem ? 1 : 0.55, outline: reward.canRedeem ? '1.5px solid rgba(91,79,232,0.15)' : 'none' }}
                            >
                                <div style={{ fontSize: 36, marginBottom: 10 }}>{reward.icon}</div>
                                <h3 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)', marginBottom: 8 }}>{reward.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
                                    <Award size={13} style={{ color: 'var(--primary)' }} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{reward.points} pts</span>
                                </div>
                                <button
                                    onClick={() => handleRedeem(reward.id)}
                                    disabled={!reward.canRedeem}
                                    className={reward.canRedeem ? 'btn-primary' : 'btn-ghost'}
                                    style={{ width: '100%', padding: '9px 0', fontSize: 12, cursor: reward.canRedeem ? 'pointer' : 'not-allowed' }}
                                >
                                    {reward.canRedeem ? 'Redeem' : 'Need more points'}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* History */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <TrendingUp size={15} style={{ color: 'var(--primary)' }} />
                        <p className="section-label">Points History</p>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {history.map((entry, i) => (
                            <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{entry.description}</p>
                                    <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{entry.date}</p>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 15, color: entry.type === 'earn' ? 'var(--success)' : 'var(--danger)' }}>
                                    {entry.type === 'earn' ? '+' : ''}{entry.points}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
