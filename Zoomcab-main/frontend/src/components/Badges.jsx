import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';

const BADGES = [
    { id: 1, name: 'First Ride', icon: '🏃', description: 'Complete your first ride', unlocked: true, progress: 100 },
    { id: 2, name: 'Frequent Rider', icon: '🔥', description: 'Take 10 rides', unlocked: true, progress: 100 },
    { id: 3, name: 'Night Owl', icon: '🌙', description: '5 rides after 10 PM', unlocked: false, progress: 60 },
    { id: 4, name: 'Early Bird', icon: '☀️', description: '5 rides before 7 AM', unlocked: false, progress: 40 },
    { id: 5, name: 'Century', icon: '💯', description: 'Complete 100 rides', unlocked: false, progress: 12 },
    { id: 6, name: '5-Star Member', icon: '⭐', description: 'Maintain 5.0 rating for 20 rides', unlocked: true, progress: 100 },
];

const Badges = () => {
    const unlockedCount = BADGES.filter(b => b.unlocked).length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-400" />
                    <h3 className="text-lg font-bold text-white">Achievements</h3>
                </div>
                <div className="text-sm font-semibold text-gray-400">
                    {unlockedCount}/{BADGES.length} Unlocked
                </div>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-3 gap-3">
                {BADGES.map((badge, index) => (
                    <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative p-4 rounded-xl border backdrop-blur-xl text-center transition-all ${badge.unlocked
                                ? 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/30 shadow-[0_0_20px_rgba(255,153,51,0.2)]'
                                : 'bg-black/20 border-white/5 opacity-60'
                            }`}
                    >
                        {/* Badge Icon */}
                        <div className="text-4xl mb-2 relative">
                            {badge.unlocked ? (
                                badge.icon
                            ) : (
                                <>
                                    <div className="blur-sm">{badge.icon}</div>
                                    <Lock size={20} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500" />
                                </>
                            )}
                        </div>

                        {/* Badge Name */}
                        <div className="text-xs font-bold text-white mb-1">{badge.name}</div>
                        <div className="text-[10px] text-gray-400 leading-tight">{badge.description}</div>

                        {/* Progress Bar (for locked badges) */}
                        {!badge.unlocked && (
                            <div className="mt-2">
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                                        style={{ width: `${badge.progress}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1">{badge.progress}%</div>
                            </div>
                        )}

                        {/* Unlocked Badge Glow */}
                        {badge.unlocked && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Trophy size={12} className="text-white" />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Badges;
