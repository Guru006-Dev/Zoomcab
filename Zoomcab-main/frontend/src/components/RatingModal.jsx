import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ThumbsUp, Heart, Zap, Send } from 'lucide-react';

const RatingModal = ({ isOpen, onClose, driverName = 'Rajesh Kumar', onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [selectedCompliments, setSelectedCompliments] = useState([]);

    const compliments = [
        { id: 1, icon: ThumbsUp, label: 'Great Service' },
        { id: 2, icon: Heart, label: 'Friendly' },
        { id: 3, icon: Zap, label: 'Quick Pickup' },
        { id: 4, label: 'Safe Driver' },
        { id: 5, label: 'Clean Car' },
        { id: 6, label: 'Good Music' },
    ];

    const toggleCompliment = (id) => {
        setSelectedCompliments(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        if (rating === 0) return;

        onSubmit?.({
            rating,
            feedback,
            compliments: selectedCompliments,
        });

        // Reset and close
        setRating(0);
        setFeedback('');
        setSelectedCompliments([]);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
                    >
                        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={20} className="text-white" />
                            </button>

                            {/* Header */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-white mb-2">Rate Your Ride</h2>
                                <p className="text-gray-400 text-sm">How was your experience with {driverName}?</p>
                            </div>

                            {/* Star Rating */}
                            <div className="flex justify-center gap-3 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            size={40}
                                            className={`transition-colors ${star <= (hoveredRating || rating)
                                                    ? 'fill-orange-400 text-orange-400'
                                                    : 'text-gray-600'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Compliments */}
                            {rating > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6"
                                >
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Add Compliments</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {compliments.map((comp) => {
                                            const Icon = comp.icon;
                                            return (
                                                <button
                                                    key={comp.id}
                                                    onClick={() => toggleCompliment(comp.id)}
                                                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all ${selectedCompliments.includes(comp.id)
                                                            ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(255,153,51,0.3)]'
                                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                                        }`}
                                                >
                                                    {Icon && <Icon size={14} />}
                                                    {comp.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* Feedback Text */}
                            {rating > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="mb-6"
                                >
                                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Additional Feedback (Optional)</h3>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Share more details about your experience..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                                    />
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={rating === 0}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${rating > 0
                                        ? 'bg-orange-500 text-white hover:bg-orange-400 shadow-[0_0_30px_rgba(255,153,51,0.4)]'
                                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={20} />
                                Submit Rating
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default RatingModal;
