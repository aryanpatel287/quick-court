import { createContext, useContext } from 'react';

export const MapsContext = createContext({
    provider: 'osm',
    capabilities: {},
    status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
    error: null,
    services: {
        places: null,
        geocoding: null,
        routing: null,
    },
});

export const useMaps = () => useContext(MapsContext);
