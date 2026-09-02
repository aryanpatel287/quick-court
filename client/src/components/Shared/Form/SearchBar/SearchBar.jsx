import { useState, useRef } from 'react';
import { useAnimatedPlaceholder } from './hooks/useAnimatedPlaceholder';
import { useClickOutside } from '@/hooks/useClickOutside';
import SearchInputRow from './subcomponents/SearchInputRow';
import './SearchBar.scss';

/**
 * Modular SearchBar Component
 */
function SearchBar({
    value = '',
    onChange,
    onClear,
    placeholder = 'Search...',
    placeholderPrefix = 'Search by ',
    placeholderOptions = [],
    placeholderInterval = 3500,
    className = '',
}) {
    const [isFocused, setIsFocused] = useState(false);
    const searchbarRef = useRef(null);

    // Animated placeholder options cycling hook
    const { currentIndex, prevIndex, hasAnimatedOptions } = useAnimatedPlaceholder(
        placeholderOptions,
        placeholderInterval,
    );

    // Click outside listener to close dropdown
    useClickOutside(searchbarRef, () => setIsFocused(false), { enabled: isFocused });

    // Event Handlers
    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onChange) {
            onChange({ target: { value: '' } });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setIsFocused(false);
        }
    };

    return (
        <div className={`searchbar-container ${className}`} ref={searchbarRef}>
            <SearchInputRow
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onClear={handleClear}
                placeholder={placeholder}
                placeholderPrefix={placeholderPrefix}
                placeholderOptions={placeholderOptions}
                hasAnimatedOptions={hasAnimatedOptions}
                currentIndex={currentIndex}
                prevIndex={prevIndex}
                isFocused={isFocused}
            />
        </div>
    );
}

export default SearchBar;
