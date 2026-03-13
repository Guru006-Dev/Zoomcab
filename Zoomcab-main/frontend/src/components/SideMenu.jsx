import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, User, Car, Wallet, Settings, LogOut, MapPin, Sliders, Calendar, ChevronRight, Gift, Users } from 'lucide-react';

const SideMenu = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const menuItems = [
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: Car, label: 'My Rides', path: '/rides' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: MapPin, label: 'Saved Places', path: '/saved-places' },
        { icon: Calendar, label: 'Schedule Ride', path: '/schedule-ride' },
        { icon: Sliders, label: 'Ride Preferences', path: '/ride-preferences' },
        { icon: Gift, label: 'Rewards', path: '/rewards' },
        { icon: Users, label: 'Refer & Earn', path: '/referrals' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const handleNavigation = (path) => {
        onClose();
        setTimeout(() => navigate(path), 300); // Wait for close animation
    };

    const handleLogout = () => {
        onClose();
        navigate('/');
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 z-[3000] backdrop-blur-sm"
                />
            )}

            {/* Menu Drawer */}
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: isOpen ? 0 : "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-0 left-0 bottom-0 w-80 bg-black/10 backdrop-blur-xl z-[3001] border-r border-white/5 flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-8 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-pink-600 p-[2px] shadow-[0_0_20px_rgba(255,100,0,0.5)]">
                            <img
                                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
                                alt="User"
                                className="w-full h-full rounded-full object-cover border-2 border-black"
                            />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Guru One</h2>
                            <span className="text-xs text-green-400 font-mono">4.8 RATING</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 py-8 px-4 space-y-2">
                    {menuItems.map((item, index) => (
                        <motion.button
                            key={index}
                            onClick={() => handleNavigation(item.path)}
                            whileHover={{ x: 5, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                            className="w-full flex items-center justify-between p-4 rounded-xl text-gray-300 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <item.icon size={20} className="text-gray-500 group-hover:text-orange-400 transition-colors" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-700 group-hover:text-white" />
                        </motion.button>
                    ))}
                </div>

                {/* Footer / Logout */}
                <div className="p-8 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors w-full"
                    >
                        <LogOut size={20} />
                        <span className="font-bold tracking-wide">LOGOUT</span>
                    </button>
                    <p className="mt-6 text-[10px] text-gray-700 text-center font-mono">
                        ZOOMCAB v2.0 // SECURE BUILD
                    </p>
                </div>
            </motion.div>
        </>
    );
};

export default SideMenu;
