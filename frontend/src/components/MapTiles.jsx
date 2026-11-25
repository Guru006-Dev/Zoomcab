import { TileLayer } from 'react-leaflet';

/** Keyless dark basemap, for use inside a MapContainer. */
export default function MapTiles() {
    return (
        <TileLayer
            className="map-dark"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        />
    );
}
