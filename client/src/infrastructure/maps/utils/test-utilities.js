/* global process */
import { normalizeCoordinate } from './coordinates.js';
import { getHaversineDistance } from './haversine.js';
import { sampleRouteNodes } from './routeSampling.js';
import { getCoordinatesBounds } from './bounds.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
    }
}

function runTests() {
    console.log('🧪 Starting Maps Infrastructure Utilities Unit Tests...\n');

    // Test 1: Coordinates Normalization
    try {
        console.log('🔄 Testing normalizeCoordinate...');

        // Array format
        const c1 = normalizeCoordinate([21.1702, 72.8311]);
        assert(c1.lat === 21.1702 && c1.lng === 72.8311, 'Failed normalizing array coordinate');

        // Lat/Lng object
        const c2 = normalizeCoordinate({ lat: 10, lng: 20 });
        assert(c2.lat === 10 && c2.lng === 20, 'Failed normalizing standard lat/lng object');

        // Latitude/Longitude object
        const c3 = normalizeCoordinate({ latitude: 15, longitude: 25 });
        assert(c3.lat === 15 && c3.lng === 25, 'Failed normalizing latitude/longitude object');

        // Google LatLng duck typing
        const googleMock = {
            lat: () => 30,
            lng: () => 40,
        };
        const c4 = normalizeCoordinate(googleMock);
        assert(c4.lat === 30 && c4.lng === 40, 'Failed normalizing Google LatLng mock');

        console.log('✅ normalizeCoordinate passed!');
    } catch (e) {
        console.error('❌ normalizeCoordinate failed:', e.message);
        process.exit(1);
    }

    // Test 2: Haversine Geodesic Distance
    try {
        console.log('\n📏 Testing getHaversineDistance...');

        const surat = { lat: 21.1702, lng: 72.8311 };
        const mumbai = { lat: 19.076, lng: 72.8777 }; // Approx 233 km

        const dist = getHaversineDistance(surat, mumbai);
        const distKm = dist / 1000;

        console.log(`Computed distance Surat -> Mumbai: ${distKm.toFixed(2)} km`);
        assert(
            distKm > 220 && distKm < 240,
            'Haversine distance calculation is outside reasonable limits',
        );

        console.log('✅ getHaversineDistance passed!');
    } catch (e) {
        console.error('❌ getHaversineDistance failed:', e.message);
        process.exit(1);
    }

    // Test 3: Route Sampling
    try {
        console.log('\n📈 Testing sampleRouteNodes...');

        const path = [
            { lat: 21.17, lng: 72.83 }, // Start
            { lat: 21.175, lng: 72.83 }, // +550m
            { lat: 21.18, lng: 72.83 }, // +550m
            { lat: 21.185, lng: 72.83 }, // +550m
        ];

        // Sample at 1000m intervals
        const sampled = sampleRouteNodes(path, 1000);
        console.log(
            `Original route points: ${path.length}, Sampled points (1km steps): ${sampled.length}`,
        );

        assert(sampled.length < path.length, 'Route sampling did not reduce waypoint count');
        assert(sampled[0].lat === 21.17, 'Start point was not preserved');
        assert(sampled[sampled.length - 1].lat === 21.185, 'End point was not preserved');

        console.log('✅ sampleRouteNodes passed!');
    } catch (e) {
        console.error('❌ sampleRouteNodes failed:', e.message);
        process.exit(1);
    }

    // Test 4: Bounding Box Bounds Calculation
    try {
        console.log('\n📦 Testing getCoordinatesBounds...');

        const coords = [
            { lat: 5, lng: 10 },
            { lat: -5, lng: 20 },
            { lat: 10, lng: -10 },
        ];

        const bounds = getCoordinatesBounds(coords);
        console.log('Computed Bounds:', JSON.stringify(bounds));

        assert(bounds.northEast.lat === 10, 'Failed resolving max latitude');
        assert(bounds.northEast.lng === 20, 'Failed resolving max longitude');
        assert(bounds.southWest.lat === -5, 'Failed resolving min latitude');
        assert(bounds.southWest.lng === -10, 'Failed resolving min longitude');

        console.log('✅ getCoordinatesBounds passed!');
    } catch (e) {
        console.error('❌ getCoordinatesBounds failed:', e.message);
        process.exit(1);
    }

    console.log('\n🎉 All Maps Infrastructure Utilities tests passed successfully!');
}

runTests();
