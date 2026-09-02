import { normalizeCoordinate } from './coordinates.js';
import { getHaversineDistance } from './haversine.js';

/**
 * Samples a route geometry (polyline path) to return nodes separated by approximately `sampleIntervalMeters`.
 * Useful for tracking mock vehicle movements along a path.
 */
export const sampleRouteNodes = (path, sampleIntervalMeters = 500) => {
    if (!Array.isArray(path) || path.length === 0) return [];

    const normalizedPath = path.map(normalizeCoordinate);
    if (normalizedPath.length <= 1) return normalizedPath;

    const sampled = [normalizedPath[0]];
    let lastSampled = normalizedPath[0];
    let accumulatedDistance = 0;

    for (let i = 1; i < normalizedPath.length; i++) {
        const prev = normalizedPath[i - 1];
        const curr = normalizedPath[i];
        const dist = getHaversineDistance(prev, curr);

        accumulatedDistance += dist;

        if (accumulatedDistance >= sampleIntervalMeters) {
            sampled.push(curr);
            lastSampled = curr;
            accumulatedDistance = 0;
        }
    }

    const finalNode = normalizedPath[normalizedPath.length - 1];
    if (lastSampled.lat !== finalNode.lat || lastSampled.lng !== finalNode.lng) {
        sampled.push(finalNode);
    }

    return sampled;
};
