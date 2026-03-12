import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2, Users, Gift } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import useReferrals from '../hooks/useReferrals';

export default function Referrals() {
    const { code, referrals, totalReferrals, totalEarnings, pendingCount, shareViaWhatsApp, copyReferralLink } = useReferrals();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => { copyReferralLink(); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    const steps = [
        { n: 1, title: 'Share your code', sub: 'Send to friends via WhatsApp or copy the link' },
        { n: 2, title: 'They sign up', sub: 'Friend joins Zoomcab using your referral code' },
        { n: 3, title: 'Both get ₹100!', sub: 'Reward is credited after their first ride' },
    ];

    return (
        <PageLayout title="Refer & Earn" subtitle="Share ZoomCab and earn together">
            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                        { label: 'Total', val: totalReferrals, color: 'var(--text-1)' },
                        { label: 'Earned', val: `₹${totalEarnings}`, color: 'var(--success)' },
                        { label: 'Pending', val: pendingCount, color: 'var(--warning)' },
                    ].map(s => (
                        <div key={s.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.val}</div>
                            <div className="section-label" style={{ marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Code card */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    style={{ borderRadius: 24, padding: 28, background: 'linear-gradient(135deg,#5B4FE8,#8B7CF6)', color: '#fff', textAlign: 'center', boxShadow: '0 16px 48px rgba(91,79,232,0.35)' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', opacity: 0.8, marginBottom: 10 }}>YOUR REFERRAL CODE</p>
                    <div style={{ fontFamily: 'monospace', fontSize: 40, fontWeight: 900, letterSpacing: '0.12em', marginBottom: 8 }}>{code}</div>
                    <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>Share with friends — you both get ₹100 off!</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={shareViaWhatsApp}
                            style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.2)', color: '#fff', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backdropFilter: 'blur(8px)', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                            <Share2 size={15} /> WhatsApp
                        </button>
                        <button onClick={handleCopy}
                            style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.35)', cursor: 'pointer', background: 'transparent', color: '#fff', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </motion.div>

                {/* How it works */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Gift size={14} style={{ color: 'var(--primary)' }} />
                        <p className="section-label">How It Works</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {steps.map(s => (
                            <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.n === 3 ? 'var(--success)' : 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{s.n}</div>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>{s.title}</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{s.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Referral history */}
                {referrals.length > 0 && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Users size={14} style={{ color: 'var(--primary)' }} />
                            <p className="section-label">Your Referrals</p>
                        </div>
                        {referrals.map((ref, i) => (
                            <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: i < referrals.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{ref.name}</p>
                                    <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{ref.date}</p>
                                </div>
                                {ref.status === 'completed'
                                    ? <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>+₹{ref.reward}</span>
                                    : <span className="badge" style={{ background: '#FEF9C3', color: '#854D0E', border: '1px solid #FDE68A' }}>Pending</span>
                                }
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
