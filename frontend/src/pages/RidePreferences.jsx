import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music, Wind, MessageCircle, Dog, Save, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const RidePreferences = () => {
    const navigate = useNavigate();
    const [savedPopup, setSavedPopup] = useState(false);
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem('zoomcab-ride-preferences');
        return saved ? JSON.parse(saved) : {
            music: 'any',
            ac: 'moderate',
            conversation: 'no-preference',
            petFriendly: false,
        };
    });

    const handleSave = () => {
        localStorage.setItem('zoomcab-ride-preferences', JSON.stringify(preferences));
        setSavedPopup(true);
        setTimeout(() => setSavedPopup(false), 2000);
    };

    const updatePref = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    return (
        <PageLayout title="Ride Preferences" subtitle="Customize your trip environment">
            <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Music Preference */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="card" style={{ padding: 20 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Music size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>Music</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {['off', 'low', 'any'].map((option) => (
                            <button
                                key={option}
                                onClick={() => updatePref('music', option)}
                                style={{
                                    padding: '12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                                    transition: 'all 0.2s', textTransform: 'capitalize',
                                    background: preferences.music === option ? 'var(--primary)' : 'var(--surface3)',
                                    color: preferences.music === option ? '#fff' : 'var(--text-2)',
                                    border: preferences.music === option ? 'none' : '1.5px solid var(--border)',
                                    boxShadow: preferences.music === option ? '0 4px 14px rgba(91,79,232,0.3)' : 'none'
                                }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* AC Preference */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="card" style={{ padding: 20 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wind size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>Air Conditioning</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {['low', 'moderate', 'high'].map((option) => (
                            <button
                                key={option}
                                onClick={() => updatePref('ac', option)}
                                style={{
                                    padding: '12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                                    transition: 'all 0.2s', textTransform: 'capitalize',
                                    background: preferences.ac === option ? 'var(--primary)' : 'var(--surface3)',
                                    color: preferences.ac === option ? '#fff' : 'var(--text-2)',
                                    border: preferences.ac === option ? 'none' : '1.5px solid var(--border)',
                                    boxShadow: preferences.ac === option ? '0 4px 14px rgba(91,79,232,0.3)' : 'none'
                                }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Conversation Preference */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="card" style={{ padding: 20 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>Conversation</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {[
                            { value: 'quiet', label: 'Quiet' },
                            { value: 'no-preference', label: 'Any' },
                            { value: 'chatty', label: 'Chatty' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => updatePref('conversation', option.value)}
                                style={{
                                    padding: '12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                                    transition: 'all 0.2s', textTransform: 'capitalize',
                                    background: preferences.conversation === option.value ? 'var(--primary)' : 'var(--surface3)',
                                    color: preferences.conversation === option.value ? '#fff' : 'var(--text-2)',
                                    border: preferences.conversation === option.value ? 'none' : '1.5px solid var(--border)',
                                    boxShadow: preferences.conversation === option.value ? '0 4px 14px rgba(91,79,232,0.3)' : 'none'
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Pet Friendly */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="card" style={{ padding: 20 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Dog size={18} style={{ color: '#16A34A' }} />
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Pet-Friendly Rides</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>Request drivers who accept pets</p>
                            </div>
                        </div>

                        <button
                            onClick={() => updatePref('petFriendly', !preferences.petFriendly)}
                            style={{
                                width: 44, height: 24, borderRadius: 12, padding: 3,
                                background: preferences.petFriendly ? 'var(--success)' : 'var(--surface3)',
                                border: preferences.petFriendly ? 'none' : '1px solid var(--border)',
                                cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
                            }}
                        >
                            <div style={{
                                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                position: 'absolute', top: 3, transition: 'left 0.2s',
                                left: preferences.petFriendly ? 'calc(100% - 21px)' : 3,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }} />
                        </button>
                    </div>
                </motion.div>

                <div style={{ marginTop: 10 }}>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        style={{ width: '100%', padding: '16px 0', fontSize: 15 }}
                    >
                        {savedPopup ? <><CheckCircle size={18} /> Saved successfully</> : <><Save size={18} /> Save Preferences</>}
                    </button>
                </div>

            </div>
        </PageLayout>
    );
};

export default RidePreferences;
