import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Smartphone, Banknote, ArrowLeft,
    Gift, Tag, CheckCircle, Shield, IndianRupee, Zap,
} from 'lucide-react';
import { TestimonialCarousel } from '../components/ui/profile-card-testimonial-carousel';
import { socket } from '../api';

/* ─── tiny helpers ───────────────────────────────────────── */
const VALID_PROMOS = { ZOOM50: 50, FIRST10: 10, SAVE25: 25 };
const TIP_OPTIONS = [0, 20, 50, 100];
const METHODS = [
    { id: 'card', icon: CreditCard, label: 'Card' },
    { id: 'upi', icon: Smartphone, label: 'UPI' },
    { id: 'cash', icon: Banknote, label: 'Cash' },
];

/* ─── Credit Card visual ─────────────────────────────────── */
function CardVisual({ flipped, onFlip }) {
    return (
        <div
            onClick={onFlip}
            style={{ perspective: 1000, height: 180, cursor: 'pointer', marginBottom: 20 }}
        >
            <div style={{
                position: 'relative', width: '100%', height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
                {/* Front */}
                <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    borderRadius: 20, padding: 24,
                    background: 'linear-gradient(135deg,#5B4FE8,#8B7CF6,#A78BFA)',
                    boxShadow: '0 16px 48px rgba(91,79,232,0.40)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: 38, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#FFD700,#FFA500)', opacity: 0.9 }} />
                        <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em' }}>VISA</span>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 17, color: '#fff', letterSpacing: '0.2em', fontWeight: 600 }}>
                        •••• &nbsp;•••• &nbsp;•••• &nbsp;4242
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Card Holder</div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Guru One</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Expires</div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>12/28</div>
                        </div>
                    </div>
                    <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>tap to flip</div>
                </div>
                {/* Back */}
                <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    borderRadius: 20, overflow: 'hidden',
                    background: 'linear-gradient(135deg,#4840CC,#5B4FE8)',
                    boxShadow: '0 16px 48px rgba(91,79,232,0.40)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24,
                }}>
                    <div style={{ height: 36, background: 'rgba(0,0,0,0.35)', marginBottom: 20 }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CVV</span>
                        <div style={{ background: '#fff', color: '#1A1D2E', fontFamily: 'monospace', fontWeight: 700, padding: '4px 14px', borderRadius: 6 }}>123</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── UPI visual ─────────────────────────────────────────── */
function UpiVisual() {
    /* deterministic QR-like grid */
    const pattern = Array.from({ length: 64 }, (_, i) => ((i * 37 + 13) % 3 !== 0));
    return (
        <div style={{ height: 180, borderRadius: 20, border: '1.5px solid var(--border2)', background: 'var(--surface2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20, padding: 20 }}>
            <div style={{ background: '#fff', padding: 8, borderRadius: 10, boxShadow: '0 2px 12px rgba(91,79,232,0.12)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,10px)', gap: 1 }}>
                    {pattern.map((on, i) => (
                        <div key={i} style={{ width: 10, height: 10, background: on ? '#1A1D2E' : '#fff', borderRadius: 1 }} />
                    ))}
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>UPI / VPA</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', background: 'var(--surface3)', padding: '5px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>guru@okicici</div>
            </div>
        </div>
    );
}

/* ─── Cash visual ────────────────────────────────────────── */
function CashVisual() {
    return (
        <div style={{ height: 180, borderRadius: 20, border: '1.5px solid #BBF7D0', background: '#F0FDF4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
                <IndianRupee size={60} style={{ color: '#16A34A' }} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#15803D' }}>Pay on Delivery</div>
                <div style={{ fontSize: 12, color: '#4ADE80', marginTop: 3 }}>Hand cash directly to your driver</div>
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Payment() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const baseVehicle = state?.vehicle || { price: 250, icon: '🚗', name: 'Sedan' };
    const vehicle = { ...baseVehicle, price: typeof baseVehicle.price === 'number' ? baseVehicle.price : (state?.price || 250) };
    const pickup = state?.pickup || 'Current Location';
    const dropoff = state?.dropoff || 'Destination';

    const [method, setMethod] = useState('card');
    const [flipped, setFlipped] = useState(false);
    const [selectedTip, setSelectedTip] = useState(0);
    const [customTip, setCustomTip] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [promoMsg, setPromoMsg] = useState(null); // null | 'ok' | 'err'
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const finalTip = customTip ? (parseInt(customTip) || 0) : selectedTip;
    const total = Math.max(0, vehicle.price + 5 + finalTip - discount);

    const applyPromo = () => {
        const v = VALID_PROMOS[promoCode.trim().toUpperCase()];
        if (v) { setDiscount(v); setPromoMsg('ok'); }
        else { setDiscount(0); setPromoMsg('err'); }
    };

    const handlePay = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setSuccess(true);
            if (socket.connected && state?.rideId) {
                socket.emit('payment_completed_broadcast', { rideId: state.rideId, driverId: state.driverId });
            }
            setTimeout(() => navigate('/home', { state: { rideStatus: 'confirmed', driverId: state.driverId } }), 2800);
        }, 2000);
    };

    /* ─── render ─────────────────────────────────────── */
    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
            {/* Decorative blobs */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: -80, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(91,79,232,0.08) 0%,transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: -60, right: -80, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,124,246,0.07) 0%,transparent 70%)' }} />
            </div>

            {/* Top nav */}
            <div style={{ width: '100%', maxWidth: 520, padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-1)', lineHeight: 1 }}>Confirm Payment</h1>
                    <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 3 }}>Review your ride and pay securely</p>
                </div>
            </div>

            {/* Main card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                style={{ width: '100%', maxWidth: 520, padding: '20px 24px 40px', position: 'relative', zIndex: 1 }}
            >
                {/* ── Trip summary strip ── */}
                <div className="card" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 28, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {vehicle.image ? <img src={vehicle.image} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🚗'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{vehicle.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>
                            {pickup} → {dropoff}
                        </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>₹{vehicle.price}</div>
                </div>

                {/* ── Testimonial Carousel ── */}
                <div style={{ marginBottom: 24, marginInline: -24 }}>
                    <TestimonialCarousel vehicleName={vehicle.name} />
                </div>

                {/* ── Payment method tabs ── */}
                <div className="card" style={{ padding: 12, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 4px 4px' }}>
                        Payment Method
                    </p>
                    {METHODS.map(({ id, icon: Icon, label }) => {
                        const isChecked = method === id;
                        return (
                            <label
                                key={id}
                                className={`inline-flex justify-between w-full items-center z-10 rounded-xl p-3 border transition-all cursor-pointer duration-500 relative overflow-hidden ${isChecked
                                    ? 'border-[#5B4FE8] text-[#5B4FE8] bg-[#F8F7FF] font-bold shadow-[0_2px_10px_rgba(91,79,232,0.1)]'
                                    : 'border-transparent text-gray-500 hover:bg-[#F3F4F6]'
                                    }`}
                                onClick={(e) => { e.preventDefault(); setMethod(id); setFlipped(false); }}
                            >
                                <div className="inline-flex items-center gap-3 relative z-10 w-full h-6">
                                    <Icon size={22} className={`absolute left-0 transition-all duration-500 ${isChecked ? 'text-[#5B4FE8]' : 'text-gray-400'}`} />

                                    <p className={`font-bold absolute left-9 top-0 leading-[22px] transition-all duration-500 ${isChecked
                                        ? 'opacity-100 translate-y-0 translate-x-0'
                                        : 'opacity-0 translate-y-[110%] translate-x-8'
                                        }`}>
                                        {label}
                                    </p>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300 shrink-0 ${isChecked ? 'border-[#5B4FE8]' : 'border-gray-300'}`}>
                                    <div className={`w-2 h-2 rounded-full bg-[#5B4FE8] transition-transform duration-300 ${isChecked ? 'scale-100' : 'scale-0'}`} />
                                </div>
                            </label>
                        );
                    })}
                </div>



                {/* ── Bill details ── */}
                <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                    <p className="section-label" style={{ marginBottom: 14 }}>Bill Summary</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Row label={<><span style={{ marginRight: 6 }}>{vehicle.icon}</span>Ride fare ({vehicle.name})</>} value={`₹${vehicle.price.toFixed(2)}`} />
                        <Row label="Platform fee & tax" value="₹5.00" muted />
                    </div>

                    <div className="divider" style={{ margin: '14px 0' }} />

                    {/* Tip */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Gift size={13} style={{ color: 'var(--success)' }} />
                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>Add a tip for driver</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {TIP_OPTIONS.map(t => (
                                <button key={t} onClick={() => { setSelectedTip(t); setCustomTip(''); }}
                                    style={{
                                        padding: '7px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font)',
                                        background: selectedTip === t && !customTip ? 'var(--primary)' : 'var(--surface3)',
                                        color: selectedTip === t && !customTip ? '#fff' : 'var(--text-3)',
                                        transition: 'all 0.2s',
                                    }}>
                                    {t === 0 ? 'No Tip' : `₹${t}`}
                                </button>
                            ))}
                            <input
                                type="number" placeholder="Custom ₹" value={customTip}
                                onChange={e => { setCustomTip(e.target.value); setSelectedTip(0); }}
                                style={{ width: 90, padding: '7px 12px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--surface3)', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--text-1)', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Promo */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Tag size={13} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>Promo code</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text" placeholder="e.g. ZOOM50" value={promoCode}
                                onChange={e => { setPromoCode(e.target.value); setPromoMsg(null); }}
                                className="input" style={{ flex: 1, padding: '9px 14px', fontSize: 13 }}
                            />
                            <button onClick={applyPromo} className={promoMsg === 'ok' ? 'btn-primary' : 'btn-ghost'} style={{ padding: '9px 18px', fontSize: 13 }}>
                                {promoMsg === 'ok' ? 'Applied ✓' : 'Apply'}
                            </button>
                        </div>
                        {promoMsg === 'ok' && <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 6 }}>₹{discount} discount applied!</p>}
                        {promoMsg === 'err' && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 6 }}>Invalid promo code.</p>}
                    </div>

                    <div className="divider" style={{ margin: '16px 0' }} />

                    {finalTip > 0 && <Row label="Driver tip" value={`+₹${finalTip}`} color="var(--success)" />}
                    {discount > 0 && <Row label="Promo discount" value={`−₹${discount}`} color="var(--success)" style={{ marginTop: 6 }} />}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1.5px solid var(--border)' }}>
                        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-1)' }}>Total</span>
                        <span style={{ fontWeight: 900, fontSize: 28, color: 'var(--primary)', letterSpacing: '-0.04em' }}>₹{total.toFixed(2)}</span>
                    </div>
                </div>

                {/* ── Security note ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                    <Shield size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Your payment is secured with 256-bit SSL encryption</span>
                </div>

                {/* ── Pay button ── */}
                <motion.button
                    onClick={handlePay}
                    disabled={processing || success}
                    whileHover={!processing && !success ? { scale: 1.01 } : {}}
                    whileTap={!processing && !success ? { scale: 0.98 } : {}}
                    style={{
                        width: '100%', padding: '16px 0', borderRadius: 18, border: 'none', cursor: processing || success ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font)', fontWeight: 800, fontSize: 16, letterSpacing: '0.01em',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        background: success ? 'linear-gradient(135deg,#16A34A,#22C55E)' : 'linear-gradient(135deg,var(--primary),#8B7CF6)',
                        color: '#fff',
                        boxShadow: success ? '0 8px 32px rgba(22,163,74,0.35)' : '0 8px 32px rgba(91,79,232,0.40)',
                        transition: 'background 0.4s, box-shadow 0.4s',
                    }}
                >
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.span key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <CheckCircle size={22} /> Payment Successful
                            </motion.span>
                        ) : processing ? (
                            <motion.span key="proc" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                                Processing…
                            </motion.span>
                        ) : (
                            <motion.span key="pay" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Zap size={18} /> Pay ₹{total.toFixed(2)}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </motion.div>
        </div>
    );
}

/* ─── tiny helper component ─────────────────────────────── */
function Row({ label, value, muted = false, color }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: muted ? 'var(--text-4)' : 'var(--text-2)' }}>{label}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: color || (muted ? 'var(--text-3)' : 'var(--text-1)') }}>{value}</span>
        </div>
    );
}
