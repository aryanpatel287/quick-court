export const normalizeCoordinate = (coord) => {
    if (!coord) return null;

    // Array format [lat, lng]
    if (Array.isArray(coord) && coord.length >= 2) {
        return { lat: Number(coord[0]), lng: Number(coord[1]) };
    }

    // Standard lat/lng object
    if (typeof coord.lat === 'number' && typeof coord.lng === 'number') {
        return { lat: coord.lat, lng: coord.lng };
    }
    if (typeof coord.latitude === 'number' && typeof coord.longitude === 'number') {
        return { lat: coord.latitude, lng: coord.longitude };
    }

    // Google LatLng instance (duck typing check for function)
    if (typeof coord.lat === 'function' && typeof coord.lng === 'function') {
        return { lat: coord.lat(), lng: coord.lng() };
    }

    throw new Error('Invalid coordinate format. Expected { lat, lng } or similar.');
};
