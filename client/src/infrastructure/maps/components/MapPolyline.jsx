import { useEffect, useRef, useMemo } from 'react';
import { useMaps } from '../context/MapsContext';
import { useOsmMap } from '../providers/osm/OsmMapView';
import { useMap } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import { normalizeCoordinate } from '../utils/coordinates';

export function MapPolyline({ path = [], color = '#6366f1', weight = 4, opacity = 0.8, ...props }) {
    const { provider } = useMaps();
    const osmMap = useOsmMap();
    const googleMap = useMap();
    const googlePolylineRef = useRef(null);

    const serializedPath = JSON.stringify(path);
    const normalizedPath = useMemo(() => {
        const parsedPath = JSON.parse(serializedPath);
        return parsedPath.map(normalizeCoordinate).filter(Boolean);
    }, [serializedPath]);

    // Leaflet OSM Polyline setup
    useEffect(() => {
        if (provider !== 'osm' || !osmMap || normalizedPath.length < 2) return;

        const leafletPath = normalizedPath.map((p) => [p.lat, p.lng]);
        const polyline = L.polyline(leafletPath, {
            color,
            weight,
            opacity,
            ...props,
        }).addTo(osmMap);

        // Auto-fit bounds when polyline renders
        if (leafletPath.length > 0) {
            osmMap.fitBounds(polyline.getBounds(), { padding: [30, 30] });
        }

        return () => {
            polyline.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider, osmMap, serializedPath, color, weight, opacity]);

    // Google Maps Polyline setup via Map Instance
    useEffect(() => {
        if (provider !== 'google' || !googleMap || normalizedPath.length < 2) return;

        // Clean up previous polyline
        if (googlePolylineRef.current) {
            googlePolylineRef.current.setMap(null);
        }

        const polyline = new window.google.maps.Polyline({
            path: normalizedPath,
            strokeColor: color,
            strokeWeight: weight,
            strokeOpacity: opacity,
            ...props,
        });

        polyline.setMap(googleMap);
        googlePolylineRef.current = polyline;

        // Auto-fit viewport bounds to show the complete polyline path
        const bounds = new window.google.maps.LatLngBounds();
        normalizedPath.forEach((pt) => bounds.extend(pt));
        googleMap.fitBounds(bounds, 30);

        return () => {
            if (googlePolylineRef.current) {
                googlePolylineRef.current.setMap(null);
                googlePolylineRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider, googleMap, serializedPath, color, weight, opacity]);

    return null;
}
