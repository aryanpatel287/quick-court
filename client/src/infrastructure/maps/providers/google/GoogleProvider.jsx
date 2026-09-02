import { useState, useEffect } from 'react';
import {
    APIProvider,
    useMapsLibrary,
    useApiLoadingStatus,
    APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { MapsContext } from '../../context/MapsContext';
import { MAP_CONFIG } from '../../config';
import { getCapabilities } from '../../capabilities';
import { createGooglePlacesAdapter } from './googlePlaces.adapter';
import { createGoogleGeocodingAdapter } from './googleGeocoding.adapter';
import { createGoogleRoutingAdapter } from './googleRouting.adapter';

const REQUIRED_LIBRARIES = ['places', 'geocoding', 'routes', 'marker', 'geometry'];

function GoogleLibraryLoader({ children, setServices, setStatus, setError }) {
    const apiLoadingStatus = useApiLoadingStatus();
    const placesLib = useMapsLibrary('places');
    const geocodingLib = useMapsLibrary('geocoding');
    const routesLib = useMapsLibrary('routes');

    useEffect(() => {
        if (apiLoadingStatus === APILoadingStatus.AUTH_FAILURE) {
            const authErr = new Error(
                'Google Maps Authentication Error: The provided API key is invalid, restricted, or billing/Maps JavaScript API is not enabled for this project in Google Cloud Console.',
            );
            console.error(authErr);
            setError(authErr);
            setStatus('error');
            return;
        }

        if (apiLoadingStatus === APILoadingStatus.FAILED) {
            const loadErr = new Error(
                'Failed to load Google Maps script. Check your network connection and configuration.',
            );
            console.error(loadErr);
            setError(loadErr);
            setStatus('error');
            return;
        }

        if (apiLoadingStatus === APILoadingStatus.LOADED) {
            try {
                setServices({
                    places: createGooglePlacesAdapter(placesLib || window.google?.maps?.places),
                    geocoding: createGoogleGeocodingAdapter(geocodingLib || window.google?.maps),
                    routing: createGoogleRoutingAdapter(routesLib || window.google?.maps),
                });
                setStatus('ready');
                setError(null);
            } catch (err) {
                console.error('Error initializing Google services:', err);
                setError(err);
                setStatus('error');
            }
        }
    }, [apiLoadingStatus, placesLib, geocodingLib, routesLib, setServices, setStatus, setError]);

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
            libraries={REQUIRED_LIBRARIES}
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

