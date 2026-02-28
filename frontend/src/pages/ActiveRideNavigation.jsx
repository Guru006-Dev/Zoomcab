import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, MessageCircle, Navigation2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Fix Leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Uber-style marker icons (blue pins)
const uberMarkerIcon = new L.divIcon({
    html: `< div style = "position: relative;" >
        <div style="width: 40px; height: 50px; background: #1E88E5; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>
        <div style="position: absolute; top: 10px; left: 10px; width: 20px; height: 20px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
    </div > `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    className: 'uber-marker',
});

// Component to fit map bounds
const MapBounds = ({ positions }) => {
    const map = useMap();
    if (positions && positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [100, 100] });
    }
    return null;
};

const ActiveRideNavigation = () => {
    const navigate = useNavigate();
    const [routePath, setRoutePath] = useState([]);

    // Mock ride data
    const rideData = {
        driver: 'Rajesh Kumar',
        rating: 4.8,
        vehicle: 'Zoom Auto',
        vehicleNumber: 'TN 37 AB 1234',
        pickup: { name: 'RS Puram, Coimbatore', coords: [11.0168, 76.9558] },
        dropoff: { name: 'Coimbatore Airport', coords: [11.0297, 77.0436] },
        eta: '3 mins',
    };

    // Fetch real route from OSRM on component mount
    useEffect(() => {
        const fetchRoute = async () => {
            try {
                const start = rideData.pickup.coords;
                const end = rideData.dropoff.coords;
                const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.routes && data.routes[0]) {
                    // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
                    const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    setRoutePath(coords);
                }
            } catch (error) {
                console.error('Failed to fetch route:', error);
                // Fallback to straight line
                setRoutePath([rideData.pickup.coords, rideData.dropoff.coords]);
            }
        };

        fetchRoute();
    }, []);


    return (
        <div className="h-screen w-full relative overflow-hidden font-sans bg-black">
            {/* Map with Satellite View */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={[11.0232, 76.9997]} // Center between pickup and dropoff
                    zoom={12}
                    zoomControl={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    {/* Satellite/Hybrid View - Using Esri World Imagery */}
                    <TileLayer
                        attribution='&copy; Esri'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    {/* Road Labels Overlay */}
                    <TileLayer
                        attribution='&copy; CartoDB'
                        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                        opacity={0.8}
                    />

                    {/* Orange Dashed Route Line (Uber style) */}
                    <Polyline
                        positions={routePath}
                        color="#FF9933"
                        weight={6}
                        opacity={0.9}
                        dashArray="10, 10"
                    />

                    {/* Pickup Marker (Blue Pin) */}
                    <Marker position={rideData.pickup.coords} icon={uberMarkerIcon}>
                        <Popup>{rideData.pickup.name}</Popup>
                    </Marker>

                    {/* Dropoff Marker (Blue Pin) */}
                    <Marker position={rideData.dropoff.coords} icon={uberMarkerIcon}>
                        <Popup>{rideData.dropoff.name}</Popup>
                    </Marker>

                    <MapBounds positions={routePath} />
                </MapContainer>
            </div>

            {/* Top-left corner city label */}
            <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                <span className="text-white text-sm font-semibold">Coimbatore, TN</span>
            </div>

            {/* Top-right back button */}
            <button
                onClick={() => navigate('/driver')}
                className="absolute top-4 right-4 z-20 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
                <ArrowLeft size={20} className="text-black" />
            </button>

            {/* Bottom Driver Card - Uber Style */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="bg-white rounded-t-3xl shadow-2xl p-6"
                >
                    {/* Driver Info Row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {/* Driver Avatar */}
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                                <User size={32} className="text-white" />
                            </div>

                            {/* Driver Details */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{rideData.driver}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>⭐ {rideData.rating}</span>
                                    <span>•</span>
                                    <span>{rideData.vehicle}</span>
                                </div>
                                <div className="text-sm font-semibold text-gray-800 mt-1">
                                    {rideData.vehicleNumber}
                                </div>
                            </div>
                        </div>

                        {/* ETA Badge */}
                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase tracking-wider">ETA</div>
                            <div className="text-2xl font-black text-green-600">{rideData.eta}</div>
                        </div>
                    </div>

                    {/* Destination Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-500">Pickup</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 ml-4">{rideData.pickup.name}</div>

                        <div className="flex items-center gap-2 mb-1 mt-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-gray-500">Drop-off</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 ml-4">{rideData.dropoff.name}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg">
                            <Phone size={20} />
                            Call
                        </button>
                        <button className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg">
                            <MessageCircle size={20} />
                            Chat
                        </button>
                    </div>

                    {/* Cancel Ride */}
                    <button className="w-full mt-3 py-3 text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-colors">
                        Cancel Ride
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default ActiveRideNavigation;
