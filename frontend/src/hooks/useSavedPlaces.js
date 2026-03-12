import { useState, useEffect } from 'react';

const STORAGE_KEY = 'zoomcab-saved-places';

const getStoredData = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

const useSavedPlaces = () => {
    const [places, setPlaces] = useState(() => {
        const stored = getStoredData();
        return stored?.places || [
            { id: 'home', name: 'Home', address: '', icon: '🏠', lat: null, lng: null },
            { id: 'work', name: 'Work', address: '', icon: '💼', lat: null, lng: null },
        ];
    });

    const [recentDestinations, setRecentDestinations] = useState(() => {
        const stored = getStoredData();
        return stored?.recentDestinations || [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ places, recentDestinations }));
    }, [places, recentDestinations]);

    const savePlace = (id, address, lat, lng) => {
        setPlaces(prev => prev.map(place =>
            place.id === id ? { ...place, address, lat, lng } : place
        ));
    };

    const addCustomPlace = (name, address, lat, lng) => {
        const id = `custom_${Date.now()}`;
        setPlaces(prev => [...prev, { id, name, address, icon: '📍', lat, lng }]);
    };

    const removePlace = (id) => {
        setPlaces(prev => prev.filter(place => place.id !== id));
    };

    const addRecentDestination = (destination) => {
        setRecentDestinations(prev => {
            const existing = prev.find(d => d.address === destination.address);
            if (existing) return prev;
            return [destination, ...prev.slice(0, 4)];
        });
    };

    const clearRecent = () => setRecentDestinations([]);

    return {
        places,
        recentDestinations,
        savePlace,
        addCustomPlace,
        removePlace,
        addRecentDestination,
        clearRecent,
    };
};

export default useSavedPlaces;
