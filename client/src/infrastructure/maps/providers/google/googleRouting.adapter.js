import { normalizeCoordinate } from '../../utils/coordinates';

export function createGoogleRoutingAdapter(routesLib) {
    return {
        async getRoute({ origin, destination, travelMode = 'DRIVING' }) {
            const directionsService = new routesLib.DirectionsService();
            const normalizedOrigin = normalizeCoordinate(origin);
            const normalizedDest = normalizeCoordinate(destination);

            return new Promise((resolve, reject) => {
                directionsService.route(
                    {
                        origin: normalizedOrigin,
                        destination: normalizedDest,
                        travelMode: travelMode === 'WALKING' ? 'WALKING' : 'DRIVING',
                    },
                    (response, status) => {
                        if (
                            status === 'OK' &&
                            response &&
                            response.routes &&
                            response.routes.length > 0
                        ) {
                            const route = response.routes[0];
                            const leg = route.legs[0];

                            resolve({
                                distanceMeters: leg.distance?.value || 0,
                                durationSeconds: leg.duration?.value || 0,
                                path: (route.overview_path || []).map((p) =>
                                    normalizeCoordinate(p),
                                ),
                                viewport: {
                                    northEast: normalizeCoordinate(route.bounds?.getNorthEast()),
                                    southWest: normalizeCoordinate(route.bounds?.getSouthWest()),
                                },
                                legs: route.legs.map((l) => ({
                                    distanceMeters: l.distance?.value || 0,
                                    durationSeconds: l.duration?.value || 0,
                                    startLocation: normalizeCoordinate(l.start_location),
                                    endLocation: normalizeCoordinate(l.end_location),
                                    steps: (l.steps || []).map((s) => ({
                                        distanceMeters: s.distance?.value || 0,
                                        durationSeconds: s.duration?.value || 0,
                                        instruction: s.instructions || '',
                                        path: (s.path || []).map((p) => normalizeCoordinate(p)),
                                    })),
                                })),
                            });
                        } else {
                            reject(new Error(`Routing failed with status: ${status}`));
                        }
                    },
                );
            });
        },

        async getMatrix({ origins, destinations }) {
            const service = new routesLib.DistanceMatrixService();
            const normalizedOrigins = origins.map(normalizeCoordinate);
            const normalizedDestinations = destinations.map(normalizeCoordinate);

            return new Promise((resolve, reject) => {
                service.getDistanceMatrix(
                    {
                        origins: normalizedOrigins,
                        destinations: normalizedDestinations,
                        travelMode: 'DRIVING',
                    },
                    (response, status) => {
                        if (status === 'OK' && response) {
                            const result = response.rows.map((row, i) => ({
                                origin: origins[i],
                                elements: row.elements.map((el, j) => ({
                                    destination: destinations[j],
                                    status: el.status,
                                    distanceMeters: el.distance?.value || 0,
                                    durationSeconds: el.duration?.value || 0,
                                })),
                            }));
                            resolve(result);
                        } else {
                            reject(new Error(`Distance Matrix failed with status: ${status}`));
                        }
                    },
                );
            });
        },
    };
}
