import { useState } from 'react';

const STORAGE_KEY = 'zoomcab-referrals';

const useReferrals = () => {
    const [referralData, setReferralData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {
            code: 'GURU2024',
            referrals: [
                { id: 1, name: 'Amit Kumar', status: 'completed', reward: 100, date: '2024-02-08' },
                { id: 2, name: 'Priya Sharma', status: 'pending', reward: 0, date: '2024-02-11' },
                { id: 3, name: 'Raj Patel', status: 'completed', reward: 100, date: '2024-02-05' },
            ],
        };
    });

    const totalEarnings = referralData.referrals
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.reward, 0);

    const pendingCount = referralData.referrals.filter(r => r.status === 'pending').length;

    const shareViaWhatsApp = () => {
        const message = `Hey! I'm using Zoomcab for rides and it's amazing! Use my code ${referralData.code} and we both get ₹100 off! Download: https://zoomcab.app`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const copyReferralLink = () => {
        const link = `https://zoomcab.app/ref/${referralData.code}`;
        navigator.clipboard.writeText(link);
        return link;
    };

    const shareNative = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Join Zoomcab!',
                text: `Use my code ${referralData.code} and get ₹100 off!`,
                url: `https://zoomcab.app/ref/${referralData.code}`,
            });
        }
    };

    return {
        code: referralData.code,
        referrals: referralData.referrals,
        totalReferrals: referralData.referrals.length,
        totalEarnings,
        pendingCount,
        shareViaWhatsApp,
        copyReferralLink,
        shareNative,
    };
};

export default useReferrals;
