export const MAP_PROVIDERS = {
    GOOGLE: 'google',
    OSM: 'osm',
};

const provider = import.meta.env.VITE_MAP_PROVIDER || MAP_PROVIDERS.OSM;

if (!Object.values(MAP_PROVIDERS).includes(provider)) {
    throw new Error(
        `Invalid VITE_MAP_PROVIDER configuration: "${provider}". Must be "google" or "osm".`,
    );
}

if (provider === MAP_PROVIDERS.GOOGLE && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    throw new Error('VITE_GOOGLE_MAPS_API_KEY is required when VITE_MAP_PROVIDER is "google".');
}

export const MAP_CONFIG = {
    provider,
    googleApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
};
