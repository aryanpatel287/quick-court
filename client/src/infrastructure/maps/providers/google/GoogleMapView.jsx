import { useEffect, useRef } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { normalizeCoordinate } from '../../utils/coordinates';
import { MAP_CONFIG } from '../../config';

function CameraSynchronizer({ center, zoom }) {
    const map = useMap();
    const isFirstMount = useRef(true);

    useEffect(() => {
        if (!map || !center) return;

        // Skip the very first mount since defaultCenter & defaultZoom already handle it
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const normalized = normalizeCoordinate(center);
        if (normalized && typeof normalized.lat === 'number' && typeof normalized.lng === 'number') {
            map.panTo(normalized);
        }
        if (typeof zoom === 'number') {
            map.setZoom(zoom);
        }
    }, [map, center, zoom]);

    return null;
}

export function GoogleMapView({ center, zoom = 12, mapId, children, ...props }) {
    const normalizedCenter = normalizeCoordinate(center) || { lat: 21.1702, lng: 72.8311 };

    return (
        <Map
            defaultCenter={normalizedCenter}
            defaultZoom={zoom}
            mapId={mapId || MAP_CONFIG.googleMapId || 'DEMO_MAP_ID'}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%', minHeight: '300px' }}
            {...props}
        >
            <CameraSynchronizer center={center} zoom={zoom} />
            {children}
        </Map>
    );
}


