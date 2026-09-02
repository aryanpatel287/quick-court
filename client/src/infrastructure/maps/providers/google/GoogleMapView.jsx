import { Map } from '@vis.gl/react-google-maps';
import { normalizeCoordinate } from '../../utils/coordinates';

export function GoogleMapView({ center, zoom, children, ...props }) {
    const normalizedCenter = normalizeCoordinate(center);

    return (
        <Map
            defaultCenter={normalizedCenter}
            defaultZoom={zoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%', minHeight: '300px' }}
            {...props}
        >
            {children}
        </Map>
    );
}
