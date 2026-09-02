import { normalizeCoordinate } from '../../utils/coordinates';

export function createGoogleRoutingAdapter(routesLib) {
    const lib = routesLib || window.google?.maps || {};

    const legacyRouteCompute = async ({ origin, destination, travelMode = 'DRIVING' }) => {
        const DirectionsServiceClass =
            lib.DirectionsService || window.google?.maps?.DirectionsService;
        if (!DirectionsServiceClass) throw new Error('DirectionsService is not available');
        const directionsService = new DirectionsServiceClass();
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
                            path: (route.overview_path || []).map((p) => normalizeCoordinate(p)),
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
    };

    const modernRouteCompute = async (RouteClass, { origin, destination, travelMode = 'DRIVING' }) => {
        const normalizedOrigin = normalizeCoordinate(origin);
        const normalizedDest = normalizeCoordinate(destination);

        const travelModeMap = {
            DRIVING: 'DRIVE',
            WALKING: 'WALK',
            BICYCLING: 'BICYCLE',
            TRANSIT: 'TRANSIT',
        };

        const response = await RouteClass.computeRoutes({
            origin: {
                location: {
                    latLng: {
                        latitude: normalizedOrigin.lat,
                        longitude: normalizedOrigin.lng,
                    },
                },
            },
            destination: {
                location: {
                    latLng: {
                        latitude: normalizedDest.lat,
                        longitude: normalizedDest.lng,
                    },
                },
            },
            travelMode: travelModeMap[travelMode] || 'DRIVE',
            fields: [
                'routes.distanceMeters',
                'routes.durationMillis',
                'routes.polyline',
                'routes.legs',
                'routes.viewport',
            ],
        });

        if (!response || !response.routes || response.routes.length === 0) {
            throw new Error('No route found from Route.computeRoutes');
        }

        const route = response.routes[0];
        const leg = route.legs?.[0] || {};

        let path = [];
        const decode = window.google?.maps?.geometry?.encoding?.decodePath;
        if (route.polyline?.encodedPolyline && decode) {
            path = decode(route.polyline.encodedPolyline).map(normalizeCoordinate);
        } else if (leg.polyline?.encodedPolyline && decode) {
            path = decode(leg.polyline.encodedPolyline).map(normalizeCoordinate);
        } else if (leg.steps && leg.steps.length > 0) {
            path = leg.steps.flatMap((step) => {
                if (step.polyline?.encodedPolyline && decode) {
                    return decode(step.polyline.encodedPolyline).map(normalizeCoordinate);
                }
                if (step.startLocation && step.endLocation) {
                    return [normalizeCoordinate(step.startLocation), normalizeCoordinate(step.endLocation)];
                }
                return [];
            });
        }

        if (path.length === 0) {
            path = [normalizedOrigin, normalizedDest];
        }

        const durationSeconds = route.durationMillis
            ? Math.round(route.durationMillis / 1000)
            : leg.durationMillis
            ? Math.round(leg.durationMillis / 1000)
            : 0;

        return {
            distanceMeters: route.distanceMeters || leg.distanceMeters || 0,
            durationSeconds,
            path,
            viewport: route.viewport
                ? {
                      northEast: {
                          lat: route.viewport.high?.latitude || route.viewport.northEast?.lat,
                          lng: route.viewport.high?.longitude || route.viewport.northEast?.lng,
                      },
                      southWest: {
                          lat: route.viewport.low?.latitude || route.viewport.southWest?.lat,
                          lng: route.viewport.low?.longitude || route.viewport.southWest?.lng,
                      },
                  }
                : null,
            legs: (route.legs || []).map((l) => ({
                distanceMeters: l.distanceMeters || 0,
                durationSeconds: l.durationMillis ? Math.round(l.durationMillis / 1000) : 0,
                startLocation: normalizeCoordinate(
                    l.startLocation?.latLng
                        ? {
                              lat: l.startLocation.latLng.latitude,
                              lng: l.startLocation.latLng.longitude,
                          }
                        : l.startLocation,
                ),
                endLocation: normalizeCoordinate(
                    l.endLocation?.latLng
                        ? {
                              lat: l.endLocation.latLng.latitude,
                              lng: l.endLocation.latLng.longitude,
                          }
                        : l.endLocation,
                ),
                steps: (l.steps || []).map((s) => ({
                    distanceMeters: s.distanceMeters || 0,
                    durationSeconds: s.durationMillis ? Math.round(s.durationMillis / 1000) : 0,
                    instruction: s.navigationInstruction?.instructions || s.instructions || '',
                    path:
                        s.polyline?.encodedPolyline && decode
                            ? decode(s.polyline.encodedPolyline).map(normalizeCoordinate)
                            : [],
                })),
            })),
        };
    };

    return {
        async getRoute({ origin, destination, travelMode = 'DRIVING' }) {
            const RouteClass = routesLib?.Route || window.google?.maps?.routes?.Route;
            if (RouteClass?.computeRoutes) {
                try {
                    return await modernRouteCompute(RouteClass, {
                        origin,
                        destination,
                        travelMode,
                    });
                } catch (err) {
                    console.warn(
                        'Route.computeRoutes failed, falling back to legacy DirectionsService:',
                        err.message || err,
                    );
                }
            }

            return legacyRouteCompute({ origin, destination, travelMode });
        },

        async getMatrix({ origins, destinations }) {
            const DistanceMatrixServiceClass =
                lib.DistanceMatrixService || window.google?.maps?.DistanceMatrixService;
            if (!DistanceMatrixServiceClass)
                throw new Error('DistanceMatrixService is not available');
            const service = new DistanceMatrixServiceClass();
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

