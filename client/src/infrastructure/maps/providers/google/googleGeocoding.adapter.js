import { normalizeCoordinate } from '../../utils/coordinates';

export function createGoogleGeocodingAdapter(geocodingLib) {
    const GeocoderClass = geocodingLib?.Geocoder || window.google?.maps?.Geocoder;
    const geocoder = GeocoderClass ? new GeocoderClass() : null;


    return {
        async forward(address) {
            if (!address) throw new Error('Address is required for geocoding');
            return new Promise((resolve, reject) => {
                geocoder.geocode({ address }, (results, status) => {
                    if (status === 'OK' && results && results.length > 0) {
                        const result = results[0];
                        resolve({
                            formattedAddress: result.formatted_address,
                            location: normalizeCoordinate(result.geometry.location),
                            components: parseAddressComponents(result.address_components),
                        });
                    } else {
                        reject(new Error(`Geocoding failed with status: ${status}`));
                    }
                });
            });
        },

        async reverse(coord) {
            const normalizedCoord = normalizeCoordinate(coord);
            if (!normalizedCoord) throw new Error('Invalid coordinate for reverse geocoding');
            return new Promise((resolve, reject) => {
                geocoder.geocode({ location: normalizedCoord }, (results, status) => {
                    if (status === 'OK' && results && results.length > 0) {
                        const result = results[0];
                        resolve({
                            formattedAddress: result.formatted_address,
                            location: normalizedCoord,
                            components: parseAddressComponents(result.address_components),
                        });
                    } else {
                        reject(new Error(`Reverse geocoding failed with status: ${status}`));
                    }
                });
            });
        },
    };
}

function parseAddressComponents(components = []) {
    const result = {
        city: '',
        state: '',
        country: '',
        postalCode: '',
    };

    components.forEach((comp) => {
        const types = comp.types || [];
        if (types.includes('locality')) {
            result.city = comp.long_name;
        } else if (types.includes('administrative_area_level_1')) {
            result.state = comp.long_name;
        } else if (types.includes('country')) {
            result.country = comp.long_name;
        } else if (types.includes('postal_code')) {
            result.postalCode = comp.long_name;
        }
    });

    return result;
}
