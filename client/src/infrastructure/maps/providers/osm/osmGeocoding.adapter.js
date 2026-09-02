import { normalizeCoordinate } from '../../utils/coordinates';

export function createOsmGeocodingAdapter() {
    return {
        async forward(address) {
            if (!address) throw new Error('Address is required for geocoding');
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`;
            try {
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'Apex-Maps-Template/1.0 (contact@example.com)' },
                });
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                const data = await res.json();
                if (!data || data.length === 0) throw new Error('No coordinates found via OSM');

                const first = data[0];
                return {
                    formattedAddress: first.display_name,
                    location: {
                        lat: parseFloat(first.lat),
                        lng: parseFloat(first.lon),
                    },
                    components: {
                        city:
                            first.address?.city ||
                            first.address?.town ||
                            first.address?.village ||
                            '',
                        state: first.address?.state || '',
                        country: first.address?.country || '',
                        postalCode: first.address?.postcode || '',
                    },
                };
            } catch (err) {
                console.error('OSM Geocoding forward error:', err);
                throw err;
            }
        },

        async reverse(coord) {
            const normalizedCoord = normalizeCoordinate(coord);
            if (!normalizedCoord) throw new Error('Invalid coordinate for reverse geocoding');
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${normalizedCoord.lat}&lon=${normalizedCoord.lng}`;
            try {
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'Apex-Maps-Template/1.0 (contact@example.com)' },
                });
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                const data = await res.json();
                if (!data) throw new Error('No address found via OSM');

                return {
                    formattedAddress: data.display_name,
                    location: normalizedCoord,
                    components: {
                        city:
                            data.address?.city || data.address?.town || data.address?.village || '',
                        state: data.address?.state || '',
                        country: data.address?.country || '',
                        postalCode: data.address?.postcode || '',
                    },
                };
            } catch (err) {
                console.error('OSM Geocoding reverse error:', err);
                throw err;
            }
        },
    };
}
