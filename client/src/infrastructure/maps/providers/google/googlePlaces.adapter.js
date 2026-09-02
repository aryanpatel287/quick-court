import { normalizeCoordinate } from '../../utils/coordinates';

export function createGooglePlacesAdapter(placesLib) {
    return {
        async autocomplete(query) {
            if (!query) return [];
            try {
                const { AutocompleteSuggestion } = placesLib;
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
                const autocompleteService = new placesLib.AutocompleteService();
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
                const { Place } = placesLib;
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
                console.error('Google Places getDetails error:', err);
                throw err;
            }
        },
    };
}
