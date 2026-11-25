import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, NavigationArrow as Navigation, Clock, CurrencyDollar as DollarSign, User, X, Check, Phone } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassBackground from '../components/GlassBackground';
import { acceptRide, rejectRide } from '../api';
import { XCircle, CheckCircle, Star } from '@phosphor-icons/react';

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

    if (declined) {
        return (
            <div className="h-screen w-full relative overflow-hidden font-sans flex items-center justify-center bg-black">
                <GlassBackground />
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <XCircle size={60} weight="duotone" className="mx-auto mb-4" />
                    <div className="text-2xl font-semibold text-white">Ride Declined</div>
                    <div className="text-gray-400 mt-2">Looking for next ride...</div>
                </motion.div>
            </div>
        );
    }

    if (accepted) {
        return (
            <div className="h-screen w-full relative overflow-hidden font-sans flex items-center justify-center bg-black">
                <GlassBackground />
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <CheckCircle size={60} weight="duotone" className="mx-auto mb-4" />
                    <div className="text-2xl font-semibold text-white">Ride Accepted!</div>
                    <div className="text-gray-400 mt-2">Heading to pickup location...</div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full relative overflow-hidden font-sans">
            <GlassBackground />
            <div className="absolute inset-0 bg-black/60 z-0" />

            <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
                {/* Timer Ring */}
                <div className="relative mb-8">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                            fill="none"
                        />
                        <motion.circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#5B4FE8"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: '351.86', strokeDashoffset: 0 }}
                            animate={{ strokeDashoffset: (timeLeft / 15) * 351.86 }}
                            transition={{ duration: 1, ease: 'linear' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-4xl font-semibold" style={{ color: 'var(--primary-text)' }}>{timeLeft}s</div>
                    </div>
                </div>

                {/* Ride Request Card */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-white">New Ride Request</h2>
                            <div className="text-sm font-semibold mt-1" style={{ color: 'var(--primary-text)' }}>
                                {rideRequest.surgeMultiplier}x Surge
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-semibold text-white">₹{rideRequest.estimatedFare}</div>
                            <div className="text-xs text-gray-400">{rideRequest.distance}</div>
                        </div>
                    </div>

                    {/* Rider Info */}
                    <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                            <User size={32} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="text-lg font-semibold text-white">{rideRequest.rider}</div>
                            <div className="flex items-center gap-1 text-yellow-400">
                                <span className="text-sm">{rideRequest.rating}</span>
                                <Star size={12} weight="fill" />
                            </div>
                        </div>
                        <button className="p-3 rounded-full transition-colors" style={{ background: 'rgba(91,79,232,0.15)', color: 'var(--primary-text)' }}>
                            <Phone size={20} />
                        </button>
                    </div>

                    {/* Route Info */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 rounded-full" style={{ background: 'rgba(91,79,232,0.15)' }}>
                                <MapPin size={20} style={{ color: 'var(--primary-text)' }} />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pickup</div>
                                <div className="text-white font-semibold">{rideRequest.pickup}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 rounded-full" style={{ background: 'rgba(239,68,68,0.15)' }}>
                                <Navigation size={20} className="text-red-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Dropoff</div>
                                <div className="text-white font-semibold">{rideRequest.dropoff}</div>
                            </div>
                        </div>
                    </div>

                    {/* Estimated Time */}
                    <div className="flex items-center gap-2 mb-6 p-3 rounded-xl border" style={{ background: 'rgba(91,79,232,0.1)', borderColor: 'rgba(91,79,232,0.2)' }}>
                        <Clock size={18} style={{ color: 'var(--primary-text)' }} />
                        <span className="text-sm text-gray-300">Estimated trip time: </span>
                        <span className="text-sm font-semibold text-white">{rideRequest.estimatedTime}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleDecline}
                            className="py-4 hover:bg-white/10 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
                            style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <X size={24} />
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            className="py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
                            style={{ background: '#5B4FE8', boxShadow: '0 4px 20px rgba(91,79,232,0.4)' }}
                        >
                            <Check size={24} />
                            Accept
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RideAcceptance;
