import { normalizeCoordinate } from '../../utils/coordinates';

export function createGooglePlacesAdapter(placesLib) {
    const lib = placesLib || window.google?.maps?.places || {};

    const legacyAutocomplete = async (query) => {
        const AutocompleteService =
            lib.AutocompleteService || window.google?.maps?.places?.AutocompleteService;
        if (!AutocompleteService) return [];

        return new Promise((resolve) => {
            try {
                const autocompleteService = new AutocompleteService();
                autocompleteService.getPlacePredictions({ input: query }, (predictions, status) => {
                    const PlacesServiceStatus = window.google?.maps?.places?.PlacesServiceStatus;
                    const okStatus = PlacesServiceStatus?.OK || 'OK';
                    const zeroResults = PlacesServiceStatus?.ZERO_RESULTS || 'ZERO_RESULTS';

                    if ((status === okStatus || status === 'OK') && predictions) {
                        resolve(
                            predictions.map((pred) => ({
                                id: pred.place_id,
                                description: pred.description,
                                mainText:
                                    pred.structured_formatting?.main_text || pred.description,
                                secondaryText: pred.structured_formatting?.secondary_text || '',
                            })),
                        );
                    } else if (status === zeroResults || status === 'ZERO_RESULTS') {
                        resolve([]);
                    } else {
                        console.warn('Legacy AutocompleteService response status:', status);
                        resolve([]);
                    }
                });
            } catch (err) {
                console.error('Legacy AutocompleteService error:', err);
                resolve([]);
            }
        });
    };

    const legacyDetails = async (placeId) => {
        const PlacesService =
            lib.PlacesService || window.google?.maps?.places?.PlacesService;
        if (!PlacesService) throw new Error('Legacy PlacesService is not available');

        const dummy = document.createElement('div');
        const service = new PlacesService(dummy);
        return new Promise((resolve, reject) => {
            service.getDetails(
                {
                    placeId,
                    fields: ['name', 'formatted_address', 'geometry'],
                },
                (result, status) => {
                    const PlacesServiceStatus = window.google?.maps?.places?.PlacesServiceStatus;
                    const okStatus = PlacesServiceStatus?.OK || 'OK';
                    if ((status === okStatus || status === 'OK') && result) {
                        resolve({
                            id: placeId,
                            name: result.name || '',
                            formattedAddress: result.formatted_address || '',
                            location: normalizeCoordinate(result.geometry?.location),
                        });
                    } else {
                        reject(new Error(`Places getDetails failed with status: ${status}`));
                    }
                },
            );
        });
    };

    return {
        async autocomplete(query) {
            if (!query) return [];

            // 1. Attempt Modern Places API (New) AutocompleteSuggestion
            const AutocompleteSuggestion =
                lib.AutocompleteSuggestion || window.google?.maps?.places?.AutocompleteSuggestion;
            if (AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
                try {
                    const { suggestions } =
                        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
                            input: query,
                        });
                    return (suggestions || []).map((s) => {
                        const pred = s.placePrediction;
                        return {
                            id: pred.placeId,
                            description: pred.text?.text || '',
                            mainText:
                                pred.structuredFormat?.mainText?.text || pred.text?.text || '',
                            secondaryText: pred.structuredFormat?.secondaryText?.text || '',
                        };
                    });
                } catch (err) {
                    console.warn(
                        'Places API (New) failed, gracefully falling back to legacy AutocompleteService:',
                        err.message || err,
                    );
                }
            }

            // 2. Fallback to Legacy AutocompleteService
            return legacyAutocomplete(query);
        },

        async getDetails(placeId) {
            if (!placeId) throw new Error('placeId is required for details');

            // 1. Attempt Modern Place class
            const Place = lib.Place || window.google?.maps?.places?.Place;
            if (Place) {
                try {
                    const place = new Place({ id: placeId });
                    await place.fetchFields({
                        fields: ['displayName', 'formattedAddress', 'location'],
                    });
                    return {
                        id: placeId,
                        name: place.displayName || '',
                        formattedAddress: place.formattedAddress || '',
                        location: normalizeCoordinate(place.location),
                    };
                } catch (err) {
                    console.warn(
                        'Place.fetchFields failed, gracefully falling back to legacy PlacesService:',
                        err.message || err,
                    );
                }
            }

            // 2. Fallback to Legacy PlacesService
            return legacyDetails(placeId);
        },
    };
}


