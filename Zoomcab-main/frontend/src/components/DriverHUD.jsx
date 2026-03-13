import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Star, Phone, MessageCircle, ChevronUp, ChevronDown, Navigation2, Clock } from 'lucide-react';
import autoImage from '../assets/most-popular-transport-india-auto-600nw-2368746743-Photoroom.png';

const DriverHUD = ({ onBack }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Mock driver data
    const driver = {
        name: 'Rajesh Kumar',
        rating: 4.8,
        vehicle: 'Zoom Auto',
        plate: 'TN 37 AB 1234',
        eta: '3 mins',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
    };

    return (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-[800] w-full max-w-md px-4 pb-6">
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="relative"
            >
                {/* Tab Button (Always Visible) */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-t-2xl px-6 py-3 flex items-center justify-between shadow-lg hover:bg-black/70 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500">
                            <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-white font-bold text-sm">{driver.name}</h3>
                            <div className="flex items-center gap-1">
                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-xs text-gray-300">{driver.rating}</span>
                                <span className="text-xs text-gray-500 mx-1">•</span>
                                <span className="text-xs text-gray-400">{driver.vehicle}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                            <div className="text-xs text-gray-400">ETA</div>
                            <div className="text-sm font-bold text-green-400">{driver.eta}</div>
                        </div>
                        {isExpanded ? (
                            <ChevronDown size={20} className="text-gray-400" />
                        ) : (
                            <ChevronUp size={20} className="text-gray-400" />
                        )}
                    </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-black/60 backdrop-blur-xl border-x border-b border-white/10 rounded-b-2xl p-6 space-y-4">
                                {/* Vehicle Info */}
                                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Vehicle Number</div>
                                        <div className="text-white font-mono font-bold text-lg">{driver.plate}</div>
                                    </div>
                                    <div className="text-4xl"><img src={autoImage} alt="Auto" style={{ width: 44, height: 44, objectFit: 'contain' }} /></div>
                                </div>

                                {/* Trip Status */}
                                <div className="flex items-center gap-3 bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                                    <Navigation2 size={20} className="text-green-400" />
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-400">Driver is on the way</div>
                                        <div className="text-sm font-bold text-white">Arriving in {driver.eta}</div>
                                    </div>
                                    <Clock size={18} className="text-green-400 animate-pulse" />
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors">
                                        <Phone size={18} />
                                        Call
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-semibold transition-colors">
                                        <MessageCircle size={18} />
                                        Chat
                                    </button>
                                </div>

                                {/* Cancel Button */}
                                <button
                                    onClick={onBack}
                                    className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl font-semibold transition-colors"
                                >
                                    Cancel Ride
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default DriverHUD;
