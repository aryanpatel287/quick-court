import { normalizeCoordinate } from '../../utils/coordinates';

export function createGooglePlacesAdapter(placesLib) {
    const lib = placesLib || window.google?.maps?.places || {};

    return {
        async autocomplete(query) {
            if (!query) return [];
            try {
                const { AutocompleteSuggestion } = lib;
                if (AutocompleteSuggestion) {
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
                }

                // Fallback to legacy AutocompleteService for backwards compatibility
                const AutocompleteService = lib.AutocompleteService || window.google?.maps?.places?.AutocompleteService;
                if (!AutocompleteService) return [];
                const autocompleteService = new AutocompleteService();
                const response = await autocompleteService.getPlacePredictions({ input: query });
                return (response.predictions || []).map((pred) => ({
                    id: pred.place_id,
                    description: pred.description,
                    mainText: pred.structured_formatting?.main_text || pred.description,
                    secondaryText: pred.structured_formatting?.secondary_text || '',
                }));
            } catch (err) {
                console.error('Google Places autocomplete error:', err);
                return [];
            }
        },

        async getDetails(placeId) {
            if (!placeId) throw new Error('placeId is required for details');
            try {
                const { Place } = lib;
                if (Place) {
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
                }

                // Fallback to legacy PlacesService
                const PlacesService = lib.PlacesService || window.google?.maps?.places?.PlacesService;
                if (PlacesService) {
                    const dummy = document.createElement('div');
                    const service = new PlacesService(dummy);
                    return new Promise((resolve, reject) => {
                        service.getDetails(
                            {
                                placeId,
                                fields: ['name', 'formatted_address', 'geometry'],
                            },
                            (result, status) => {
                                if (status === 'OK' && result) {
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
                }

                throw new Error('Google Places service is not available');
            } catch (err) {
                console.error('Google Places getDetails error:', err);
                throw err;
            }
        },
    };
}

