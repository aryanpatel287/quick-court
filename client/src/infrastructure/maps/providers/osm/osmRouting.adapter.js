import { normalizeCoordinate } from '../../utils/coordinates';
import { getHaversineDistance } from '../../utils/haversine';

export function createOsmRoutingAdapter() {
    return {
        async getRoute({ origin, destination }) {
            const start = normalizeCoordinate(origin);
            const end = normalizeCoordinate(destination);
            if (!start || !end) throw new Error('Origin and destination are required for routing');

            const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                const data = await res.json();
                if (!data.routes || data.routes.length === 0) {
                    throw new Error('No route found via OSM OSRM');
                }

                const route = data.routes[0];
                return {
                    distanceMeters: route.distance || 0,
                    durationSeconds: route.duration || 0,
                    path: (route.geometry?.coordinates || []).map(([lng, lat]) => ({ lat, lng })),
                    viewport: null, // OSRM doesn't return viewport bounds directly
                    legs: (route.legs || []).map((leg) => ({
                        distanceMeters: leg.distance || 0,
                        durationSeconds: leg.duration || 0,
                        startLocation: start,
                        endLocation: end,
                        steps: (leg.steps || []).map((s) => ({
                            distanceMeters: s.distance || 0,
                            durationSeconds: s.duration || 0,
                            instruction: s.name || '',
                            path: (s.geometry?.coordinates || []).map(([lng, lat]) => ({
                                lat,
                                lng,
                            })),
                        })),
                    })),
                };
            } catch (err) {
                console.error('OSM routing error:', err);
                throw err;
            }
        },

        async getMatrix({ origins, destinations }) {
            // OSRM table service requires key/registration for bulk operations on free servers.
            // Using a high-precision Haversine straight-line distance fallback + constant speed duration estimates (50 km/h)
            // to guarantee this works out-of-the-box in hackathon conditions.
            return origins.map((origin) => {
                const start = normalizeCoordinate(origin);
                return {
                    origin: start,
                    elements: destinations.map((dest) => {
                        const end = normalizeCoordinate(dest);
                        const distance = getHaversineDistance(start, end);
                        return {
                            destination: end,
                            status: 'OK',
                            distanceMeters: Math.round(distance),
                            durationSeconds: Math.round(distance / 13.88), // 50 km/h average speed
                        };
                    }),
                };
            });
        },
    };
}
