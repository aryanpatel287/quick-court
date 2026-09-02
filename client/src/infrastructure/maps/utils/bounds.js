import { normalizeCoordinate } from './coordinates.js';

/**
 * Calculates the bounding box for a list of coordinates, returning `{ northEast, southWest }`.
 * Useful for fitting the map view to contain all markers or routes.
 */
export const getCoordinatesBounds = (coords) => {
    if (!Array.isArray(coords) || coords.length === 0) return null;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    coords.forEach((c) => {
        const p = normalizeCoordinate(c);
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
    });

    return {
        northEast: { lat: maxLat, lng: maxLng },
        southWest: { lat: minLat, lng: minLng },
    };
};
