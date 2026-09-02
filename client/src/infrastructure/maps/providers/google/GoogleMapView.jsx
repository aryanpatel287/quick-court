import { Map } from '@vis.gl/react-google-maps';
import { normalizeCoordinate } from '../../utils/coordinates';
import { MAP_CONFIG } from '../../config';

export function GoogleMapView({ center, zoom, mapId, children, ...props }) {
    const normalizedCenter = normalizeCoordinate(center);

    return (
        <Map
            defaultCenter={normalizedCenter}
            defaultZoom={zoom}
            center={normalizedCenter}
            zoom={zoom}
            mapId={mapId || MAP_CONFIG.googleMapId || 'DEMO_MAP_ID'}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%', minHeight: '300px' }}
            {...props}
        >
            {children}
        </Map>
    );
}

