import { MAP_CONFIG, MAP_PROVIDERS } from './config';
import { GoogleProvider } from './providers/google/GoogleProvider';
import { MapsContext } from './context/MapsContext';
import { getCapabilities } from './capabilities';
import { createOsmGeocodingAdapter } from './providers/osm/osmGeocoding.adapter';
import { createOsmRoutingAdapter } from './providers/osm/osmRouting.adapter';

export function MapProviderFactory({ children }) {
    if (MAP_CONFIG.provider === MAP_PROVIDERS.GOOGLE) {
        return <GoogleProvider>{children}</GoogleProvider>;
    }

    // Default: OpenStreetMap (OSM) via Leaflet setup (no wrapper libraries needed)
    const osmServices = {
        places: null, // OSM doesn't support client-side Places
        geocoding: createOsmGeocodingAdapter(),
        routing: createOsmRoutingAdapter(),
    };

    return (
        <MapsContext.Provider
            value={{
                provider: MAP_PROVIDERS.OSM,
                capabilities: getCapabilities(MAP_PROVIDERS.OSM),
                status: 'ready',
                error: null,
                services: osmServices,
            }}
        >
            {children}
        </MapsContext.Provider>
    );
}
