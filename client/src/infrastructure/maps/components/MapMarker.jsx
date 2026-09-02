import { useEffect } from 'react';
import { useMaps } from '../context/MapsContext';
import { useOsmMap } from '../providers/osm/OsmMapView';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import { normalizeCoordinate } from '../utils/coordinates';

export function MapMarker({ position, title, children, color = '#6366f1', ...props }) {
    const { provider } = useMaps();
    const osmMap = useOsmMap();

    const normalized = normalizeCoordinate(position);
    const lat = normalized?.lat;
    const lng = normalized?.lng;

    // Leaflet OSM Marker setup
    useEffect(() => {
        if (provider !== 'osm' || !osmMap || lat === undefined || lng === undefined) return;

        const marker = L.marker([lat, lng], {
            title: title || '',
        }).addTo(osmMap);

        if (title) {
            marker.bindPopup(`<strong>${title}</strong>`);
        }

        return () => {
            marker.remove();
        };
    }, [provider, osmMap, lat, lng, title]);

    if (provider === 'google' && normalized) {
        return (
            <AdvancedMarker position={normalized} title={title} {...props}>
                {children || <Pin background={color} borderColor="#ffffff" glyphColor="#ffffff" />}
            </AdvancedMarker>
        );
    }

    return null;
}
