import { MAP_PROVIDERS } from './config';

export const MAP_CAPABILITIES = {
    [MAP_PROVIDERS.GOOGLE]: {
        map: true,
        markers: true,
        advancedMarkers: true,
        places: true,
        autocomplete: true,
        geocoding: true,
        reverseGeocoding: true,
        routing: true,
        routeMatrix: true,
        geometry: true,
    },
    [MAP_PROVIDERS.OSM]: {
        map: true,
        markers: true,
        advancedMarkers: false,
        places: false,
        autocomplete: false,
        geocoding: true,
        reverseGeocoding: true,
        routing: true,
        routeMatrix: false,
        geometry: false,
    },
};

export const getCapabilities = (provider) => MAP_CAPABILITIES[provider] || {};
