import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Path, User, X, Check, Phone, Star, Lightning, XCircle, CheckCircle } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import './checkout.css';
import { acceptRide, rejectRide } from '../api';

const RideAcceptance = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rawRide = location.state?.ride;

    // Parse the ride data to match UI expectations
    const [rideRequest] = useState(() => {
        if (!rawRide) {
            return {
                id: 'demo_123',
                rider: 'Priya Sharma (Demo)',
                rating: 4.8,
                pickup: 'RS Puram, Coimbatore',
                dropoff: 'Airport, Coimbatore',
                distance: '12.4 km',
                estimatedFare: 280,
                surgeMultiplier: 1.5,
                estimatedTime: '18 min',
            };
        }
        return {
            id: rawRide.id,
            rider: 'Rider #' + rawRide.riderId, // Placeholder until we fetch user details
            rating: 4.9, // Placeholder
            pickup: rawRide.pickup?.address || 'Unknown Pickup',
            dropoff: rawRide.dropoff?.address || 'Unknown Dropoff',
            distance: rawRide.distance ? `${rawRide.distance} km` : 'Calculating...',
            estimatedFare: rawRide.price ? Math.round(rawRide.price) : 0,
            surgeMultiplier: 1.0,
            estimatedTime: rawRide.duration ? `${rawRide.duration} min` : '15 min'
        };
    });
    const [timeLeft, setTimeLeft] = useState(15); // 15 seconds to accept
    const [accepted, setAccepted] = useState(false);
    const [declined, setDeclined] = useState(false);

    const handleDecline = () => {
        setDeclined(true);
        // Hand the ride to the next nearest driver (ignore failures for demo rides).
        if (rideRequest?.id && rideRequest.id !== 'demo_123') rejectRide(rideRequest.id).catch(() => {});
        setTimeout(() => navigate('/driver'), 1500);
    };

    // Count down once a second; auto-decline when the time runs out.
    useEffect(() => {
        if (accepted || declined) return;
        const timer = setTimeout(() => {
            if (timeLeft <= 1) {
                setTimeLeft(0);
                handleDecline();
            } else {
                setTimeLeft(timeLeft - 1);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, accepted, declined]); // eslint-disable-line react-hooks/exhaustive-deps -- handleDecline only reads stable values

    const handleAccept = async () => {
        try {
            if (rideRequest.id && rideRequest.id !== 'demo_123') {
                try {
                    // The server notifies the rider; only one driver can win this call.
                    await acceptRide(rideRequest.id);
                } catch (e) {
                    if (e.response?.status === 409) {
                        // Another driver accepted first.
                        setDeclined(true);
                        setTimeout(() => navigate('/driver'), 1500);
                        return;
                    }
                    console.warn("DB accept failed (maybe mock ride), proceeding locally", e);
                }
            }

            setAccepted(true);
            setTimeout(() => {
                navigate('/driver', {
                    state: {
                        rideActive: true,
                        rideId: rideRequest.id,
                        pickup: rideRequest.pickup,
                        dropoff: rideRequest.dropoff
                    }
                });
            }, 2000);
        } catch (error) {
            console.error("Failed to accept ride", error);
            setDeclined(true);
            setTimeout(() => navigate('/driver'), 1500);
        }
    };

    if (declined || accepted) {
        const Icon = accepted ? CheckCircle : XCircle;
        return (
            <div className="co offer">
                <motion.div className="offer-result" role="status" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Icon size={64} weight="fill" color={accepted ? 'var(--success)' : 'var(--text-4)'} aria-hidden />
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>{accepted ? 'Ride accepted' : 'Ride declined'}</h1>
                    <p className="co-muted">{accepted ? 'Heading to the pickup.' : 'Looking for the next ride.'}</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="co offer">
            <motion.section className="co-card offer-card" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} aria-label="New ride request">
                <div className="offer-time" aria-hidden><span style={{ transform: `scaleX(${timeLeft / 15})` }} /></div>
                <div className="offer-body">
                    <div className="co-row">
                        <p className="co-muted">New ride request</p>
                        <p className="offer-count">{timeLeft}s</p>
                    </div>
                    <div>
                        <p className="offer-fare">₹{rideRequest.estimatedFare}</p>
                        <div className="offer-facts" style={{ marginTop: 16 }}>
                            <span><Path size={16} aria-hidden />{rideRequest.distance}</span>
                            <span><Clock size={16} aria-hidden />{rideRequest.estimatedTime}</span>
                            {rideRequest.surgeMultiplier > 1 && <span><Lightning size={16} weight="fill" color="var(--warning)" aria-hidden />{rideRequest.surgeMultiplier}x surge</span>}
                        </div>
                    </div>
                    <ul className="co-route">
                        <li><small>Pickup</small><strong>{rideRequest.pickup}</strong></li>
                        <li><small>Drop off</small><strong>{rideRequest.dropoff}</strong></li>
                    </ul>
                    <div className="co-row">
                        <div className="co-person">
                            <span className="co-avatar"><User size={24} aria-hidden /></span>
                            <div>
                                <strong>{rideRequest.rider}</strong>
                                <p className="co-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Star size={14} weight="fill" color="var(--warning)" aria-hidden />{rideRequest.rating}
                                </p>
                            </div>
                        </div>
                        <button type="button" className="co-icon" aria-label="Call rider"><Phone size={18} /></button>
                    </div>
                    <div className="offer-actions">
                        <button type="button" className="co-btn quiet" onClick={handleDecline}><X size={20} aria-hidden />Decline</button>
                        <button type="button" className="co-btn" onClick={handleAccept}><Check size={20} aria-hidden />Accept</button>
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default RideAcceptance;
