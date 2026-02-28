import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const socket = io(SOCKET_URL);

export const login = (username, password) => api.post('/auth/login', { username, password });
export const register = (username, password, role) => api.post('/auth/register', { username, password, role });

// Rider APIs
export const requestRide = (pickup, dropoff, vehicleType, price) => api.post('/rider/request-ride', { pickup, dropoff, vehicleType, price });
export const getRideStatus = (rideId) => api.get(`/rider/ride-status/${rideId}`);

// Driver APIs
// Driver APIs
export const getAvailableDrivers = () => api.get('/driver/available');
export const acceptRide = (rideId) => api.post(`/driver/accept-ride/${rideId}`);
export const completeRide = (rideId) => api.post(`/driver/complete-ride/${rideId}`);
export const updateLocationAPI = (lat, lng) => api.post('/driver/location', { lat, lng });

// Socket Location Update Wrapper
export const updateLocation = (lat, lng) => {
    // Send via socket for real-time
    socket.emit('updateLocation', { driverId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null, lat, lng });
    // Also update via API for persistence if needed
    // updateLocationAPI(lat, lng);
};

export default api;
