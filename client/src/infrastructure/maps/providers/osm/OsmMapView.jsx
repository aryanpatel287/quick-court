/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState, createContext, useContext } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { normalizeCoordinate } from '../../utils/coordinates';

// Fix Leaflet default icon imports under bundlers (Vite)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIconRetina,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export const OsmMapContext = createContext(null);
export const useOsmMap = () => useContext(OsmMapContext);

export function OsmMapView({ center, zoom, children, ...props }) {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);

    const normalizedCenter = normalizeCoordinate(center);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize leaflet map
        const map = L.map(containerRef.current).setView(
            [normalizedCenter.lat, normalizedCenter.lng],
            zoom,
        );
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        setMapInstance(map);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                setMapInstance(null);
            }
        };
    }, [normalizedCenter.lat, normalizedCenter.lng, zoom]);

    const centerLat = normalizedCenter?.lat;
    const centerLng = normalizedCenter?.lng;

    // Update center dynamically if prop changes
    useEffect(() => {
        if (mapInstance && centerLat !== undefined && centerLng !== undefined) {
            mapInstance.setView([centerLat, centerLng]);
        }
    }, [mapInstance, centerLat, centerLng]);

    return (
        <div
            ref={containerRef}
            className="osm-map-container"
            style={{ width: '100%', height: '100%', minHeight: '300px' }}
            {...props}
        >
            {mapInstance && (
                <OsmMapContext.Provider value={mapInstance}>{children}</OsmMapContext.Provider>
            )}
        </div>
    );
}
