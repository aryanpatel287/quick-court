import { useState, useEffect } from 'react';
import {
    MapProviderFactory,
    useMaps,
    MapView,
    MapMarker,
    MapPolyline,
    PlaceAutocomplete,
} from '@/infrastructure/maps';
import './MapsShowcase.scss';

function MapsDashboardContent() {
    const { provider, capabilities, services } = useMaps();

    // Coordinates and Map State
    const [center, setCenter] = useState({ lat: 21.1702, lng: 72.8311 }); // Surat, India
    const [zoom, setZoom] = useState(13);
    const [markers, setMarkers] = useState([
        {
            id: '1',
            position: { lat: 21.1702, lng: 72.8311 },
            title: 'Surat Center',
            color: '#6366f1',
        },
    ]);

    // Geocoding States
    const [geocodeInput, setGeocodeInput] = useState('');
    const [geocodedResult, setGeocodedResult] = useState(null);
    const [revGeocodeLat, setRevGeocodeLat] = useState('21.1702');
    const [revGeocodeLng, setRevGeocodeLng] = useState('72.8311');
    const [revGeocodedAddress, setRevGeocodedAddress] = useState('');

    // Routing States
    const [routeStart, setRouteStart] = useState(null);
    const [routeEnd, setRouteEnd] = useState(null);
    const [computedRoute, setComputedRoute] = useState(null);
    const [routingLoading, setRoutingLoading] = useState(false);

    // Distance Matrix States
    const [matrixResults, setMatrixResults] = useState(null);
    const [matrixLoading, setMatrixLoading] = useState(false);

    // Mock Customer Location
    const customerLocation = { lat: 21.1702, lng: 72.8311 };
    // Mock Drivers Locations
    const drivers = [
        { name: 'Driver A (Adajan)', location: { lat: 21.195, lng: 72.819 } },
        { name: 'Driver B (Varachha)', location: { lat: 21.16, lng: 72.85 } },
        { name: 'Driver C (Althan)', location: { lat: 21.18, lng: 72.8 } },
    ];

    // Trigger matrix calculation
    const handleCalculateMatrix = async () => {
        if (!services.routing) return;
        setMatrixLoading(true);
        try {
            const origins = drivers.map((d) => d.location);
            const destinations = [customerLocation];
            const matrix = await services.routing.getMatrix({ origins, destinations });

            // Combine matrix results with driver names
            const results = drivers.map((driver, index) => {
                const element = matrix[index]?.elements[0] || {};
                return {
                    name: driver.name,
                    distanceKm: ((element.distanceMeters || 0) / 1000).toFixed(2),
                    durationMin: Math.round((element.durationSeconds || 0) / 60),
                    status: element.status || 'OK',
                };
            });

            // Sort by nearest (duration first, then distance)
            results.sort((a, b) => a.durationMin - b.durationMin);
            setMatrixResults(results);

            // Add drivers to markers
            const newMarkers = [
                {
                    id: 'customer',
                    position: customerLocation,
                    title: 'Customer (Destination)',
                    color: '#ef4444',
                },
                ...drivers.map((d, i) => ({
                    id: `driver-${i}`,
                    position: d.location,
                    title: d.name,
                    color: '#10b981',
                })),
            ];
            setMarkers(newMarkers);
            setCenter(customerLocation);
            setZoom(12);
        } catch (err) {
            console.error('Matrix calculation failed:', err);
            alert('Failed to calculate route matrix. ' + err.message);
        } finally {
            setMatrixLoading(false);
        }
    };

    // Forward Geocoding
    const handleGeocode = async (e) => {
        e.preventDefault();
        if (!geocodeInput || !services.geocoding) return;
        try {
            const res = await services.geocoding.forward(geocodeInput);
            setGeocodedResult(res);
            setCenter(res.location);
            setMarkers([
                {
                    id: 'geocode-res',
                    position: res.location,
                    title: res.formattedAddress,
                    color: '#f59e0b',
                },
            ]);
            setZoom(15);
        } catch (err) {
            console.error('Geocoding failed:', err);
            alert('Geocoding failed: ' + err.message);
        }
    };

    // Reverse Geocoding
    const handleReverseGeocode = async (e) => {
        e.preventDefault();
        if (!services.geocoding) return;
        try {
            const coord = { lat: parseFloat(revGeocodeLat), lng: parseFloat(revGeocodeLng) };
            const res = await services.geocoding.reverse(coord);
            setRevGeocodedAddress(res.formattedAddress);
            setCenter(res.location);
            setMarkers([
                {
                    id: 'rev-geocode-res',
                    position: res.location,
                    title: res.formattedAddress,
                    color: '#ec4899',
                },
            ]);
            setZoom(15);
        } catch (err) {
            console.error('Reverse geocoding failed:', err);
            alert('Reverse geocoding failed: ' + err.message);
        }
    };

    // Trigger route computation when start and end change
    useEffect(() => {
        const fetchRoute = async () => {
            if (!routeStart || !routeEnd || !services.routing) return;
            setRoutingLoading(true);
            try {
                const res = await services.routing.getRoute({
                    origin: routeStart.location,
                    destination: routeEnd.location,
                });
                setComputedRoute(res);

                // Setup markers for route start and end
                setMarkers([
                    {
                        id: 'start',
                        position: routeStart.location,
                        title: `Start: ${routeStart.address}`,
                        color: '#10b981',
                    },
                    {
                        id: 'end',
                        position: routeEnd.location,
                        title: `End: ${routeEnd.address}`,
                        color: '#ef4444',
                    },
                ]);
            } catch (err) {
                console.error('Routing computation failed:', err);
                alert('Could not compute routing path. ' + err.message);
            } finally {
                setRoutingLoading(false);
            }
        };
        fetchRoute();
    }, [routeStart, routeEnd, services.routing]);

    return (
        <div className="maps-showcase-grid">
            {/* Header info */}
            <div className="maps-showcase-header card">
                <div>
                    <h2>Maps Infrastructure Showcase</h2>
                    <p className="subtitle">
                        Currently using: <strong>{provider.toUpperCase()} Maps</strong>
                    </p>
                </div>
                <div className="caps-badges">
                    {Object.entries(capabilities).map(([key, val]) => (
                        <span key={key} className={`badge ${val ? 'supported' : 'unsupported'}`}>
                            {key}: {val ? '✓' : '✗'}
                        </span>
                    ))}
                </div>
            </div>

            {/* Main Interactive Map */}
            <div className="map-display-panel card">
                <div className="map-wrapper">
                    <MapView center={center} zoom={zoom}>
                        {markers.map((m) => (
                            <MapMarker
                                key={m.id}
                                position={m.position}
                                title={m.title}
                                color={m.color}
                            />
                        ))}
                        {computedRoute && <MapPolyline path={computedRoute.path} color="#3b82f6" weight={5} />}
                    </MapView>
                </div>
            </div>

            {/* Operations Cards Container */}
            <div className="controls-grid">
                {/* Geocoding Controls */}
                <div className="card operations-card">
                    <h3>Forward / Reverse Geocoding</h3>
                    <form onSubmit={handleGeocode} className="form-group">
                        <label>Find Coordinates from Address</label>
                        <div className="input-group">
                            <input
                                type="text"
                                value={geocodeInput}
                                onChange={(e) => setGeocodeInput(e.target.value)}
                                placeholder="Enter address (e.g. Surat, Gujarat)"
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!services.geocoding}
                            >
                                Search
                            </button>
                        </div>
                        {geocodedResult && (
                            <div className="result-panel">
                                <p className="result-title">Resolved Address:</p>
                                <p className="result-text">{geocodedResult.formattedAddress}</p>
                                <p className="result-coords">
                                    Lat: {geocodedResult.location.lat.toFixed(5)}, Lng:{' '}
                                    {geocodedResult.location.lng.toFixed(5)}
                                </p>
                            </div>
                        )}
                    </form>

                    <hr className="divider" />

                    <form onSubmit={handleReverseGeocode} className="form-group">
                        <label>Find Address from Coordinates</label>
                        <div className="coord-inputs">
                            <input
                                type="number"
                                step="any"
                                value={revGeocodeLat}
                                onChange={(e) => setRevGeocodeLat(e.target.value)}
                                placeholder="Lat"
                            />
                            <input
                                type="number"
                                step="any"
                                value={revGeocodeLng}
                                onChange={(e) => setRevGeocodeLng(e.target.value)}
                                placeholder="Lng"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-secondary btn-block"
                            disabled={!services.geocoding}
                        >
                            Reverse Geocode
                        </button>
                        {revGeocodedAddress && (
                            <div className="result-panel">
                                <p className="result-title">Resolved Address:</p>
                                <p className="result-text">{revGeocodedAddress}</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Routing Controls */}
                <div className="card operations-card">
                    <h3>Route Computation</h3>
                    <div className="form-group">
                        <label>Start Location</label>
                        <PlaceAutocomplete
                            onPlaceSelect={(place) => setRouteStart(place)}
                            placeholder="Enter origin location..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Destination Location</label>
                        <PlaceAutocomplete
                            onPlaceSelect={(place) => setRouteEnd(place)}
                            placeholder="Enter destination location..."
                        />
                    </div>

                    {routingLoading && <p className="status-text">Calculating route geometry...</p>}

                    {computedRoute && (
                        <div className="result-panel route-summary">
                            <div className="metric">
                                <span className="label">Distance</span>
                                <span className="val">
                                    {((computedRoute.distanceMeters || 0) / 1000).toFixed(2)} km
                                </span>
                            </div>
                            <div className="metric">
                                <span className="label">Duration</span>
                                <span className="val">
                                    {Math.round((computedRoute.durationSeconds || 0) / 60)} mins
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Distance Matrix Controls */}
                <div className="card operations-card">
                    <h3>Route Matrix (Hackathon Driver Dispatch)</h3>
                    <p className="description">
                        Resolves travel times/distances from 3 mock drivers on the map to the target
                        customer location:
                    </p>
                    <div className="customer-info result-panel">
                        <p>
                            <strong>Customer Location:</strong> Surat Center ({customerLocation.lat}
                            , {customerLocation.lng})
                        </p>
                        <ul className="driver-list">
                            {drivers.map((d, idx) => (
                                <li key={idx}>
                                    {d.name} ({d.location.lat}, {d.location.lng})
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={handleCalculateMatrix}
                        className="btn btn-primary btn-block"
                        disabled={matrixLoading || !services.routing}
                    >
                        {matrixLoading ? 'Calculating Matrix...' : 'Dispatch Nearest Driver'}
                    </button>


                    {matrixResults && (
                        <div className="matrix-results-panel">
                            <h4>Nearest Drivers (Sorted):</h4>
                            {matrixResults.map((res, index) => (
                                <div
                                    key={index}
                                    className={`matrix-row ${index === 0 ? 'nearest-row' : ''}`}
                                >
                                    <div className="driver-name">
                                        {index === 0 && <span className="crown">🏆 </span>}
                                        {res.name}
                                    </div>
                                    <div className="driver-stats">
                                        <span>{res.durationMin} mins</span>
                                        <span className="dot">•</span>
                                        <span>{res.distanceKm} km</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MapsShowcase() {
    return (
        <MapProviderFactory>
            <MapsDashboardContent />
        </MapProviderFactory>
    );
}
