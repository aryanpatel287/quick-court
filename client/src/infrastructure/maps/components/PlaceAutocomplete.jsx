import { useState, useEffect } from 'react';
import { useMaps } from '../context/MapsContext';
import './PlaceAutocomplete.scss';

export function PlaceAutocomplete({
    onPlaceSelect,
    placeholder = 'Search address...',
    className = '',
}) {
    const { services, provider } = useMaps();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (!val || val.length < 3) {
            setSuggestions([]);
        }
    };

    useEffect(() => {
        if (!query || query.length < 3) {
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                if (provider === 'google' && services.places) {
                    const results = await services.places.autocomplete(query);
                    setSuggestions(results);
                } else if (services.geocoding) {
                    // OSM Fallback: Query Nominatim Search API
                    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'Apex-Maps-Template/1.0 (contact@example.com)' },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(
                            data.map((item) => ({
                                id: item.place_id || String(item.lat) + String(item.lon),
                                description: item.display_name,
                                mainText: item.name || item.display_name.split(',')[0],
                                secondaryText: item.display_name
                                    .split(',')
                                    .slice(1)
                                    .join(',')
                                    .trim(),
                                location: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
                            })),
                        );
                    }
                }
            } catch (err) {
                console.error('Autocomplete search error:', err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [query, services, provider]);

    const handleSelect = async (item) => {
        setQuery(item.description);
        setSuggestions([]);
        try {
            if (provider === 'google' && services.places) {
                const details = await services.places.getDetails(item.id);
                onPlaceSelect({
                    address: details.formattedAddress,
                    location: details.location,
                });
            } else {
                onPlaceSelect({
                    address: item.description,
                    location: item.location,
                });
            }
        } catch (err) {
            console.error('Error fetching place details:', err);
        }
    };

    return (
        <div className={`place-autocomplete-container ${className}`}>
            <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder={placeholder}
                className="place-autocomplete-input"
            />
            {loading && <div className="place-autocomplete-spinner"></div>}
            {suggestions.length > 0 && (
                <ul className="place-autocomplete-suggestions">
                    {suggestions.map((item) => (
                        <li
                            key={item.id}
                            className="place-autocomplete-suggestion-item"
                            onClick={() => handleSelect(item)}
                        >
                            <span className="main-text">{item.mainText}</span>
                            {item.secondaryText && (
                                <span className="secondary-text"> - {item.secondaryText}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
