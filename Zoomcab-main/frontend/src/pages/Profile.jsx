import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Check, Star, Award } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Badges from '../components/Badges';

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState({
        name: 'Guru One',
        phone: '+91 98765 43210',
        email: 'guru.one@zoomcab.in',
    });

    return (
        <PageLayout
            title="Profile"
            subtitle="Manage your account"
            headerRight={
                <button
                    onClick={() => setIsEditing(e => !e)}
                    className={isEditing ? 'btn-primary' : 'btn-ghost'}
                    style={{ padding: '8px 16px', fontSize: 13, gap: 6 }}
                >
                    {isEditing ? <><Check size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
                </button>
            }
        >
            <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Avatar card */}
                <motion.div layout className="card" style={{ padding: 32, textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 20px' }}>
                        <img
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                            alt="Profile"
                            style={{ width: '100%', height: '100%', borderRadius: 24, objectFit: 'cover', border: '3px solid var(--primary-lt)' }}
                        />
                        <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: 'var(--success)', border: '3px solid var(--surface)' }} />
                    </div>

                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { key: 'name', label: 'Full Name', type: 'text' },
                                    { key: 'phone', label: 'Phone', type: 'text' },
                                    { key: 'email', label: 'Email', type: 'email' },
                                ].map(({ key, label, type }) => (
                                    <div key={key} style={{ textAlign: 'left' }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', display: 'block', marginBottom: 4 }}>{label}</label>
                                        <input
                                            className="input"
                                            type={type}
                                            value={userData[key]}
                                            onChange={e => setUserData({ ...userData, [key]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h2 style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{userData.name}</h2>
                                <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4 }}>{userData.phone}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{userData.email}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 24 }}>
                        {[
                            { label: 'Rating', value: '4.8 ★', color: 'var(--warning)' },
                            { label: 'Total Rides', value: '124', color: 'var(--primary)' },
                            { label: 'Since', value: '2023', color: 'var(--success)' },
                        ].map(s => (
                            <div key={s.label} style={{ padding: 14, borderRadius: 14, background: 'var(--surface3)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
                                <div className="section-label" style={{ marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Badges */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Award size={16} style={{ color: 'var(--primary)' }} />
                        <p className="section-label">Achievements</p>
                    </div>
                    <Badges />
                </div>
            </div>
        </PageLayout>
    );
}
