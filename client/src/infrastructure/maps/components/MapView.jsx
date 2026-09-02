import { useMaps } from '../context/MapsContext';
import { GoogleMapView } from '../providers/google/GoogleMapView';
import { OsmMapView } from '../providers/osm/OsmMapView';
import './MapView.scss';

export function MapView({ center, zoom = 12, children, ...props }) {
    const { status, provider, error } = useMaps();

    if (status === 'loading') {
        return (
            <div className="maps-loading-state">
                <div className="spinner"></div>
                <p>Initializing Maps API...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="maps-error-state">
                <h4>Map Service Unavailable</h4>
                <p className="error-message-title">Check:</p>
                <ul className="error-checklist">
                    <li>Valid API key configuration</li>
                    <li>Referrer and API restrictions in Google Cloud Console</li>
                    <li>Network connection</li>
                </ul>
                {error && <pre className="error-details">{error.message || String(error)}</pre>}
            </div>
        );
    }

    if (provider === 'google') {
        return (
            <GoogleMapView center={center} zoom={zoom} {...props}>
                {children}
            </GoogleMapView>
        );
    }

    return (
        <OsmMapView center={center} zoom={zoom} {...props}>
            {children}
        </OsmMapView>
    );
}
