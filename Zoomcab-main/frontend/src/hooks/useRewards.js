    import { useState, useEffect, createElement } from 'react';
import evImage from '../assets/Wuling-Mini-EV-Gear-Photoroom.png';
import sedanImage from '../assets/MG-Hector(1)-Photoroom.png';
import suvImage from '../assets/bmw-m5-Photoroom.png';

const STORAGE_KEY = 'zoomcab-rewards';

const REWARDS_CATALOG = [
    { id: 1, name: 'Free Ride (₹50)', points: 500, value: 50, icon: createElement('img', { src: evImage, alt: 'EV', style: { width: 38, height: 28, objectFit: 'contain' } }) },
    { id: 2, name: 'Free Ride (₹100)', points: 1000, value: 100, icon: createElement('img', { src: sedanImage, alt: 'Sedan', style: { width: 44, height: 28, objectFit: 'contain' } }) },
    { id: 3, name: 'Free Ride (₹200)', points: 2000, value: 200, icon: createElement('img', { src: suvImage, alt: 'SUV', style: { width: 44, height: 28, objectFit: 'contain' } }) },
    { id: 4, name: '10% Off Next Ride', points: 250, value: 10, icon: '🎫' },
    { id: 5, name: '25% Off Next Ride', points: 600, value: 25, icon: '🎟️' },
    { id: 6, name: 'Priority Support', points: 800, value: 0, icon: '⭐' },
];

const useRewards = () => {
    const [rewards, setRewards] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {
            points: 1250, // Starting points for demo
            history: [
                { id: 1, type: 'earn', points: 45, description: 'Ride to Airport', date: '2024-02-10' },
                { id: 2, type: 'earn', points: 85, description: 'Ride to Station', date: '2024-02-09' },
                { id: 3, type: 'earn', points: 120, description: 'Ride to Mall', date: '2024-02-08' },
                { id: 4, type: 'redeem', points: -250, description: 'Redeemed: 10% Off', date: '2024-02-07' },
            ],
        };
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
    }, [rewards]);

    const earnPoints = (amount, description) => {
        const points = Math.floor(amount / 10); // ₹10 = 1 point
        const newEntry = {
            id: Date.now(),
            type: 'earn',
            points,
            description,
            date: new Date().toISOString().split('T')[0],
        };
        setRewards(prev => ({
            points: prev.points + points,
            history: [newEntry, ...prev.history],
        }));
    };

    const redeemPoints = (rewardId) => {
        const reward = REWARDS_CATALOG.find(r => r.id === rewardId);
        if (!reward) return false;

        if (rewards.points < reward.points) {
            return false; // Not enough points
        }

        const newEntry = {
            id: Date.now(),
            type: 'redeem',
            points: -reward.points,
            description: `Redeemed: ${reward.name}`,
            date: new Date().toISOString().split('T')[0],
        };

        setRewards(prev => ({
            points: prev.points - reward.points,
            history: [newEntry, ...prev.history],
        }));

        return true;
    };

    const getAvailableRewards = () => {
        return REWARDS_CATALOG.map(reward => ({
            ...reward,
            canRedeem: rewards.points >= reward.points,
        }));
    };

    return {
        points: rewards.points,
        history: rewards.history,
        earnPoints,
        redeemPoints,
        availableRewards: getAvailableRewards(),
    };
};

export default useRewards;
