import { useState, useEffect } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapsContext } from '../../context/MapsContext';
import { MAP_CONFIG } from '../../config';
import { getCapabilities } from '../../capabilities';
import { createGooglePlacesAdapter } from './googlePlaces.adapter';
import { createGoogleGeocodingAdapter } from './googleGeocoding.adapter';
import { createGoogleRoutingAdapter } from './googleRouting.adapter';

function GoogleLibraryLoader({ children, setServices, setStatus, setError }) {
    const placesLib = useMapsLibrary('places');
    const geocodingLib = useMapsLibrary('geocoding');
    const routesLib = useMapsLibrary('routes');

    useEffect(() => {
        if (placesLib && geocodingLib && routesLib) {
            try {
                setServices({
                    places: createGooglePlacesAdapter(placesLib),
                    geocoding: createGoogleGeocodingAdapter(geocodingLib),
                    routing: createGoogleRoutingAdapter(routesLib),
                });
                setStatus('ready');
            } catch (err) {
                console.error('Error initializing Google services:', err);
                setError(err);
                setStatus('error');
            }
        }
    }, [placesLib, geocodingLib, routesLib, setServices, setStatus, setError]);

    return children;
}

export function GoogleProvider({ children }) {
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState(null);
    const [services, setServices] = useState({
        places: null,
        geocoding: null,
        routing: null,
    });

    const handleLoadError = (err) => {
        console.error('Google Maps script load error:', err);
        setError(err || new Error('Failed to load Google Maps script.'));
        setStatus('error');
    };

    return (
        <APIProvider
            apiKey={MAP_CONFIG.googleApiKey}
            onLoad={() => setStatus('loading')}
            onError={handleLoadError}
        >
            <GoogleLibraryLoader
                setServices={setServices}
                setStatus={setStatus}
                setError={setError}
            >
                <MapsContext.Provider
                    value={{
                        provider: 'google',
                        capabilities: getCapabilities('google'),
                        status,
                        error,
                        services,
                    }}
                >
                    {children}
                </MapsContext.Provider>
            </GoogleLibraryLoader>
        </APIProvider>
    );
}
