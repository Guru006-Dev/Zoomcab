import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassBackground from '../components/GlassBackground';
import autoImage from '../assets/most-popular-transport-india-auto-600nw-2368746743-Photoroom.png';
import evImage from '../assets/Wuling-Mini-EV-Gear-Photoroom.png';
import sedanImage from '../assets/MG-Hector(1)-Photoroom.png';
import suvImage from '../assets/bmw-m5-Photoroom.png';

const ScheduleRide = () => {
    const navigate = useNavigate();
    const [scheduledRides, setScheduledRides] = useState(() => {
        const saved = localStorage.getItem('zoomcab-scheduled-rides');
        return saved ? JSON.parse(saved) : [];
    });
    const [showNewRide, setShowNewRide] = useState(false);
    const [newRide, setNewRide] = useState({
        pickup: '',
        dropoff: '',
        date: '',
        time: '',
        vehicle: 'auto',
    });

    const vehicles = [
        { id: 'auto', name: 'Auto', icon: <img src={autoImage} alt="Auto" style={{ width: 36, height: 36, objectFit: 'contain' }} />, price: 45 },
        { id: 'ev', name: 'EV', icon: <img src={evImage} alt="EV" style={{ width: 44, height: 36, objectFit: 'contain' }} />, price: 85 },
        { id: 'sedan', name: 'Sedan', icon: <img src={sedanImage} alt="Sedan" style={{ width: 48, height: 36, objectFit: 'contain' }} />, price: 120 },
        { id: 'suv', name: 'SUV', icon: <img src={suvImage} alt="SUV" style={{ width: 48, height: 36, objectFit: 'contain' }} />, price: 180 },
    ];

    const handleSchedule = () => {
        if (!newRide.pickup || !newRide.dropoff || !newRide.date || !newRide.time) {
            alert('Please fill all fields');
            return;
        }

        const ride = {
            id: Date.now(),
            ...newRide,
            vehicleDetails: vehicles.find(v => v.id === newRide.vehicle),
        };

        const updated = [...scheduledRides, ride];
        setScheduledRides(updated);
        localStorage.setItem('zoomcab-scheduled-rides', JSON.stringify(updated));

        setNewRide({ pickup: '', dropoff: '', date: '', time: '', vehicle: 'auto' });
        setShowNewRide(false);
    };

    const handleDelete = (id) => {
        const updated = scheduledRides.filter(ride => ride.id !== id);
        setScheduledRides(updated);
        localStorage.setItem('zoomcab-scheduled-rides', JSON.stringify(updated));
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <div className="h-screen w-full relative overflow-hidden font-sans">
            <GlassBackground />
            <div className="absolute inset-0 bg-black/40 z-0" />

            <div className="relative z-10 flex items-center gap-4 px-6 pt-8 pb-6">
                <button onClick={() => navigate('/home')} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md border border-white/5">
                    <ArrowLeft size={24} className="text-white" />
                </button>
                <h1 className="text-2xl font-bold tracking-wider text-white">SCHEDULE RIDE</h1>
            </div>

            <div className="relative z-10 px-6 mt-4 pb-28 overflow-y-auto h-[calc(100vh-180px)]">
                {/* Scheduled Rides List */}
                {scheduledRides.length > 0 && (
                    <div className="space-y-4 mb-6">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Upcoming Rides</h2>
                        {scheduledRides.map((ride, i) => (
                            <motion.div
                                key={ride.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-black/20 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-lg"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{ride.vehicleDetails.icon}</span>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{ride.vehicleDetails.name}</h3>
                                            <p className="text-sm text-orange-400">₹{ride.vehicleDetails.price}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(ride.id)}
                                        className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 size={18} className="text-red-400" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin size={14} className="text-green-400" />
                                        <span className="text-gray-300">{ride.pickup}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin size={14} className="text-red-400" />
                                        <span className="text-gray-300">{ride.dropoff}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm mt-3 pt-3 border-t border-white/10">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-blue-400" />
                                            <span className="text-gray-300">{new Date(ride.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-purple-400" />
                                            <span className="text-gray-300">{ride.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* New Ride Form */}
                {showNewRide ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/30 backdrop-blur-xl p-6 rounded-2xl border border-orange-500/30 shadow-lg space-y-4"
                    >
                        <h3 className="text-lg font-bold text-white mb-4">Schedule New Ride</h3>

                        <input
                            type="text"
                            placeholder="Pickup Location"
                            value={newRide.pickup}
                            onChange={(e) => setNewRide({ ...newRide, pickup: e.target.value })}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                        />

                        <input
                            type="text"
                            placeholder="Dropoff Location"
                            value={newRide.dropoff}
                            onChange={(e) => setNewRide({ ...newRide, dropoff: e.target.value })}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="date"
                                min={getTodayDate()}
                                value={newRide.date}
                                onChange={(e) => setNewRide({ ...newRide, date: e.target.value })}
                                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            />
                            <input
                                type="time"
                                value={newRide.time}
                                onChange={(e) => setNewRide({ ...newRide, time: e.target.value })}
                                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Select Vehicle</h4>
                            <div className="grid grid-cols-4 gap-2">
                                {vehicles.map((vehicle) => (
                                    <button
                                        key={vehicle.id}
                                        onClick={() => setNewRide({ ...newRide, vehicle: vehicle.id })}
                                        className={`p-3 rounded-xl text-center transition-all ${newRide.vehicle === vehicle.id
                                            ? 'bg-orange-500 shadow-[0_0_15px_rgba(255,153,51,0.4)]'
                                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">{vehicle.icon}</div>
                                        <div className="text-xs text-white font-semibold">{vehicle.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSchedule}
                                className="flex-1 py-3 bg-orange-500 hover:bg-orange-400 rounded-xl text-white font-bold transition-colors"
                            >
                                Schedule Ride
                            </button>
                            <button
                                onClick={() => setShowNewRide(false)}
                                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl text-white font-bold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <button
                        onClick={() => setShowNewRide(true)}
                        className="w-full py-4 bg-white/5 backdrop-blur-xl rounded-2xl border-2 border-dashed border-white/20 hover:border-orange-500/50 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-gray-300 hover:text-white"
                    >
                        <Plus size={24} />
                        <span className="font-semibold">Schedule New Ride</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ScheduleRide;
