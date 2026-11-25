import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, DeviceMobile, Money, ArrowLeft, CheckCircle, Car } from '@phosphor-icons/react';
import './checkout.css';
import { socket } from '../api';

const VALID_PROMOS = { ZOOM50: 50, FIRST10: 10, SAVE25: 25 };
const TIP_OPTIONS = [0, 20, 50, 100];
const METHODS = [
    { id: 'card', icon: CreditCard, label: 'Card' },
    { id: 'upi', icon: DeviceMobile, label: 'UPI' },
    { id: 'cash', icon: Money, label: 'Cash' },
];

export default function Payment() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const baseVehicle = state?.vehicle || { price: 250, name: 'Sedan' };
    const vehicle = { ...baseVehicle, price: typeof baseVehicle.price === 'number' ? baseVehicle.price : (state?.price || 250) };
    const pickup = state?.pickup || 'Current Location';
    const dropoff = state?.dropoff || 'Destination';

    const [method, setMethod] = useState('card');
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

    return (
        <div className="co">
            <div className="co-wrap">
                <header className="co-head">
                    <button type="button" className="co-icon" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={18} /></button>
                    <h1>Confirm and pay</h1>
                </header>

                <div className="co-grid">
                    <div className="co-col">
                        <section className="co-card">
                            <ul className="co-route">
                                <li><small>Pickup</small><strong>{pickup}</strong></li>
                                <li><small>Drop off</small><strong>{dropoff}</strong></li>
                            </ul>
                            <hr style={{ margin: '20px 0' }} />
                            <div className="co-person">
                                <span className="co-avatar">
                                    {vehicle.image ? <img src={vehicle.image} alt="" /> : <Car size={24} />}
                                </span>
                                <div>
                                    <strong>{vehicle.name}</strong>
                                    <p className="co-muted">{state?.driverId ? 'Your driver has accepted' : 'Ride preview'}</p>
                                </div>
                            </div>
                        </section>

                        <section className="co-card">
                            <p className="co-label">Pay with</p>
                            <div className="co-methods">
                                {METHODS.map(({ id, icon: Icon, label }) => (
                                    <button type="button" key={id} className="co-method" aria-pressed={method === id} onClick={() => setMethod(id)}>
                                        <Icon size={24} weight={method === id ? 'fill' : 'regular'} aria-hidden />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="co-card">
                            <p className="co-label">Tip your driver</p>
                            <div className="co-chips">
                                {TIP_OPTIONS.map((t) => (
                                    <button type="button" key={t} className="co-chip" aria-pressed={selectedTip === t && !customTip}
                                        onClick={() => { setSelectedTip(t); setCustomTip(''); }}>
                                        {t === 0 ? 'No tip' : `₹${t}`}
                                    </button>
                                ))}
                                <input className="co-input" type="number" min="0" style={{ width: 120 }} placeholder="Other" aria-label="Custom tip in rupees"
                                    value={customTip} onChange={(e) => { setCustomTip(e.target.value); setSelectedTip(0); }} />
                            </div>
                        </section>
                    </div>

                    <aside className="co-card co-summary">
                        <p className="co-muted">Total to pay</p>
                        <p className="co-total">₹{total.toFixed(2)}</p>
                        <hr />
                        <div className="co-line"><span>Ride fare</span><span>₹{vehicle.price.toFixed(2)}</span></div>
                        <div className="co-line"><span>Platform fee and tax</span><span>₹5.00</span></div>
                        {finalTip > 0 && <div className="co-line"><span>Driver tip</span><span>₹{finalTip.toFixed(2)}</span></div>}
                        {discount > 0 && <div className="co-line co-good"><span>Promo discount</span><span>−₹{discount.toFixed(2)}</span></div>}
                        <hr />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input className="co-input" style={{ flex: 1 }} placeholder="Promo code" aria-label="Promo code" value={promoCode}
                                onChange={(e) => { setPromoCode(e.target.value); setPromoMsg(null); }} />
                            <button type="button" className="co-chip" onClick={applyPromo}>{promoMsg === 'ok' ? 'Applied' : 'Apply'}</button>
                        </div>
                        {promoMsg === 'err' && <p className="co-bad">That code is not valid.</p>}
                        <button type="button" className={`co-btn ${success ? 'done' : ''}`} onClick={handlePay} disabled={processing || success}>
                            {success && <CheckCircle size={20} weight="fill" aria-hidden />}
                            {success ? 'Payment successful' : processing ? 'Processing…' : `Pay ₹${total.toFixed(2)}`}
                        </button>
                        <p className="co-muted" style={{ textAlign: 'center' }}>Payments are simulated in this demo.</p>
                    </aside>
                </div>
            </div>
        </div>
    );
}
