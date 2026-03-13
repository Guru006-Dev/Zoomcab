import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Share2, Phone, Check, ShieldAlert } from 'lucide-react';

const SafetyModal = ({ isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const [shareLink] = useState('https://zoomcab.app/track/ABC123XYZ');

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Follow My Ride - Zoomcab',
                text: 'I\'m on a ride. Track my location here:',
                url: shareLink,
            });
        } else {
            navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSOS = () => {
        // In a real app, this would trigger emergency services
        alert('🚨 SOS Alert sent to emergency contacts and police!');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                            zIndex: 9998
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 20, pointerEvents: 'none'
                        }}
                    >
                        <div style={{
                            background: 'var(--surface)',
                            borderRadius: 24, padding: 24, width: '100%', maxWidth: 360,
                            boxShadow: '0 24px 48px rgba(91,79,232,0.12)',
                            border: '1px solid var(--border)', pointerEvents: 'auto',
                            fontFamily: 'var(--font)'
                        }}>

                            {/* Go Back / Home Button */}
                            <button
                                onClick={onClose}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '8px 12px', borderRadius: 12,
                                    background: 'var(--surface2)', color: 'var(--text-2)',
                                    border: '1px solid var(--border)', cursor: 'pointer',
                                    fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13,
                                    marginBottom: 20, transition: 'all 0.2s', width: 'max-content'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'var(--primary)';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'var(--surface2)';
                                    e.currentTarget.style.color = 'var(--text-2)';
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                }}
                            >
                                <ArrowLeft size={16} />
                                Go Back
                            </button>

                            {/* Header matching Side Menu Avatar styling */}
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 12px', fontFamily: 'system-ui, -apple-system, sans-serif',
                                    fontWeight: 900, fontSize: 64, color: '#111', lineHeight: 1,
                                    letterSpacing: '-0.04em'
                                }}>
                                    <span style={{ marginRight: '-0.12em', position: 'relative', zIndex: 2 }}>S</span>
                                    <span style={{ position: 'relative', zIndex: 1 }}>O</span>
                                    <span style={{ marginLeft: '-0.12em', position: 'relative', zIndex: 2 }}>S</span>
                                </div>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Safety Features</h2>
                                <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0, fontWeight: 500 }}>Stay secure during your ride</p>
                            </div>

                            {/* Share Trip Block */}
                            <div style={{
                                background: 'linear-gradient(135deg,#F3F1FF,#EBF0FF)',
                                borderRadius: 16, padding: 16, marginBottom: 16,
                                border: '1px solid rgba(91,79,232,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(91,79,232,0.08)', flexShrink: 0
                                    }}>
                                        <Share2 size={18} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px 0' }}>Share Trip</h3>
                                        <p style={{ fontSize: 12, color: 'var(--text-4)', margin: '0 0 12px 0', lineHeight: 1.3 }}>Send live location to friends & family</p>
                                        <button
                                            onClick={handleShare}
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: 12,
                                                background: 'var(--primary)', color: '#fff',
                                                border: 'none', cursor: 'pointer',
                                                fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                boxShadow: '0 4px 12px rgba(91,79,232,0.25)',
                                                transition: 'opacity 0.2s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                                            onMouseLeave={e => e.currentTarget.style.opacity = 1}
                                        >
                                            {copied ? <Check size={16} /> : <Share2 size={16} />}
                                            {copied ? 'Link Copied!' : 'Share Location'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contacts Block */}
                            <div style={{
                                background: '#FFF8F3',
                                borderRadius: 16, padding: 16, marginBottom: 20,
                                border: '1px solid #FFE8D6'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(249,115,22,0.08)', flexShrink: 0
                                    }}>
                                        <Phone size={18} style={{ color: '#F97316' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px 0' }}>Emergency</h3>
                                        <p style={{ fontSize: 12, color: 'var(--text-4)', margin: '0 0 12px 0', lineHeight: 1.3 }}>Quick access to local authorities</p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button style={{
                                                flex: 1, padding: '8px', borderRadius: 10,
                                                background: 'var(--surface)', color: 'var(--text-2)',
                                                border: '1px solid var(--border)', cursor: 'pointer',
                                                fontFamily: 'var(--font)', fontWeight: 600, fontSize: 12,
                                                transition: 'all 0.2s'
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                                                Police
                                            </button>
                                            <button style={{
                                                flex: 1, padding: '8px', borderRadius: 10,
                                                background: 'var(--surface)', color: 'var(--text-2)',
                                                border: '1px solid var(--border)', cursor: 'pointer',
                                                fontFamily: 'var(--font)', fontWeight: 600, fontSize: 12,
                                                transition: 'all 0.2s'
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                                                Ambulance
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SOS Button */}
                            <button
                                onClick={handleSOS}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: 14,
                                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                    color: '#fff', border: 'none', cursor: 'pointer',
                                    fontFamily: 'var(--font)', fontWeight: 800, fontSize: 14,
                                    letterSpacing: '0.05em',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    boxShadow: '0 8px 24px rgba(239,68,68,0.3)',
                                    transition: 'transform 0.2s',
                                    marginBottom: 12
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                            >
                                <AlertTriangle size={18} />
                                EMERGENCY SOS
                            </button>

                            <p style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                                SOS alerts emergency contacts & nearby zoomcab teams.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SafetyModal;
