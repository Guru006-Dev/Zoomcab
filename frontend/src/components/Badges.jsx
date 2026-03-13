import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';

/**
 * Static array defining the list of possible badges and achievements.
 * Each badge contains:
 * - id: unique identifier
 * - name: display name of the badge
 * - icon: emoji representation
 * - description: task required to unlock
 * - unlocked: boolean status
 * - progress: completion percentage (0-100)
 */
const BADGES = [
    { id: 1, name: 'First Ride', icon: '🏃', description: 'Complete your first ride', unlocked: true, progress: 100 },
    { id: 2, name: 'Frequent Rider', icon: '🔥', description: 'Take 10 rides', unlocked: true, progress: 100 },
    { id: 3, name: 'Night Owl', icon: '🌙', description: '5 rides after 10 PM', unlocked: false, progress: 60 },
    { id: 4, name: 'Early Bird', icon: '☀️', description: '5 rides before 7 AM', unlocked: false, progress: 40 },
    { id: 5, name: 'Century', icon: '💯', description: 'Complete 100 rides', unlocked: false, progress: 12 },
    { id: 6, name: '5-Star Member', icon: '⭐', description: 'Maintain 5.0 rating for 20 rides', unlocked: true, progress: 100 },
];

/**
 * Badges Component
 * 
 * Displays a visual grid of user achievements.
 * Features:
 * - Unlocked badges show with full color and a trophy ribbon glow.
 * - Locked badges are dimmed, show a lock icon, and display a progress bar.
 * - Framer Motion is used for entry animations.
 */
const Badges = () => {
    // Calculate the number of unlocked badges for the header count
    const unlockedCount = BADGES.filter(b => b.unlocked).length;

    return (
        <div className="space-y-4">
            {/* Header section with Trophy icon and unlocked count */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-400" />
                    <h3 className="text-lg font-bold text-white">Achievements</h3>
                </div>
                <div className="text-sm font-semibold text-gray-400">
                    {unlockedCount}/{BADGES.length} Unlocked
                </div>
            </div>

            {/* Grid layout for displaying individual badge items */}
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
                        {/* 
                            Badge Icon Display:
                            - If unlocked: Show original emoji
                            - If locked: Blur the emoji and overlay a Lock icon
                        */}
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

                        {/* Title and Description */}
                        <div className="text-xs font-bold text-white mb-1">{badge.name}</div>
                        <div className="text-[10px] text-gray-400 leading-tight">{badge.description}</div>

                        {/* 
                            Progress Bar: Only visible for badges that have not been unlocked yet.
                            Uses a gradient fill tracking the 'progress' value.
                        */}
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

                        {/* 
                            Success Indicator: Green trophy badge in the top-right corner
                            indicating the achievement is fully secured.
                        */}
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
