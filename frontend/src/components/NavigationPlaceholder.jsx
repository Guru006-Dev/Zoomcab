import { motion } from 'framer-motion';
import { MapPin, Navigation as NavIcon, Clock, Route, AlertCircle } from 'lucide-react';

const NavigationPlaceholder = ({ destination }) => {
    return (
        <div className="bg-black/20 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-4">
                <NavIcon size={20} className="text-blue-400" />
                <h3 className="text-lg font-bold text-white">Navigation</h3>
            </div>

            <div className="space-y-4">
                {/* Destination */}
                <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-red-500/20 rounded-full">
                        <MapPin size={18} className="text-red-400" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Destination</div>
                        <div className="text-white font-semibold">{destination || 'RS Puram, Coimbatore'}</div>
                    </div>
                </div>

                {/* ETA */}
                <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-blue-400" />
                        <span className="text-sm text-gray-300">Estimated Time</span>
                    </div>
                    <span className="text-lg font-bold text-white">12 min</span>
                </div>

                {/* Distance */}
                <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Route size={18} className="text-purple-400" />
                        <span className="text-sm text-gray-300">Distance</span>
                    </div>
                    <span className="text-lg font-bold text-white">5.2 km</span>
                </div>

                {/* Integration Note */}
                <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <AlertCircle size={18} className="text-orange-400 mt-0.5" />
                    <div className="flex-1">
                        <div className="text-xs font-semibold text-orange-400 mb-1">Integration Ready</div>
                        <div className="text-xs text-gray-400">
                            Connect to Google Maps, Apple Maps, or Waze for turn-by-turn navigation.
                        </div>
                    </div>
                </div>

                {/* Launch Navigation Button */}
                <button className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-colors">
                    <NavIcon size={20} />
                    Launch Navigation
                </button>
            </div>
        </div>
    );
};

export default NavigationPlaceholder;
