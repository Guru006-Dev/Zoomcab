"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Car, Phone } from "lucide-react";
import { cn } from "../../lib/utils";

// Mapped directly to what a ZoomCab matched driver would look like
const matchedDriver = {
  name: "Rahul Sharma",
  title: "ZoomCab Pro Driver · Toyota Prius",
  description:
    "Rahul has been a ZoomCab driver for 3 years with a perfect safety record. Known for arriving early, keeping his vehicle spotless, and providing an exceptionally smooth ride.",
  imageUrl:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
};

export function TestimonialCarousel({ className, vehicleName }) {
  return (
    <div className={cn("w-full mx-auto", className)}>
      {/* Single Unified Vertical Layout */}
      <div className='w-full mx-auto text-center bg-transparent'>
        {/* Avatar */}
        <div className='w-32 h-32 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={matchedDriver.imageUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className='w-full h-full'
            >
              <img
                src={matchedDriver.imageUrl}
                alt={matchedDriver.name}
                className='w-full h-full object-cover'
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card content */}
        <div className='px-4'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={matchedDriver.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <h2 className='text-lg font-bold mb-1' style={{ color: 'var(--text-1)' }}>
                {matchedDriver.name}
              </h2>

              <p className='text-xs font-semibold mb-3' style={{ color: 'var(--primary)' }}>
                {`ZoomCab Pro Driver · ${vehicleName || 'Toyota Prius'}`}
              </p>

              <p className='text-xs leading-relaxed mb-4' style={{ color: 'var(--text-3)' }}>
                {matchedDriver.description}
              </p>

              <div className='flex space-x-4 pt-4'>
                <button className='bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition flex-1 border border-gray-200 dark:border-gray-700 cursor-pointer flex items-center justify-center gap-2'>
                  <Car className='w-5 h-5' /> Track
                </button>
                <button className='bg-indigo-600 dark:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition flex-1 border-none shadow-lg cursor-pointer flex items-center justify-center gap-2'>
                  <Phone className='w-5 h-5' /> Call Driver
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
