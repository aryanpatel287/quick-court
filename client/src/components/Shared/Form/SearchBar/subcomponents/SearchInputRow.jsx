import { Search as SearchIcon, X as CloseIcon } from 'lucide-react';

function SearchInputRow({
    value,
    onChange,
    onKeyDown,
    onFocus,
    onClear,
    placeholder,
    placeholderPrefix,
    placeholderOptions,
    hasAnimatedOptions,
    currentIndex,
    prevIndex,
    isFocused,
}) {
    return (
        <>
            <span className="searchbar-left-icon">
                <SearchIcon size={16} strokeWidth={2.5} />
            </span>

            <div className="searchbar-input-wrapper">
                <input
                    type="text"
                    className="searchbar-input"
                    placeholder={hasAnimatedOptions ? '' : placeholder}
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                />
                {!isFocused && !value && hasAnimatedOptions && (
                    <div className="searchbar-animated-placeholder" aria-hidden="true">
                        <span className="placeholder-prefix">{placeholderPrefix.trim()}</span>
                        <span className="placeholder-option-viewport">
                            {prevIndex !== null && (
                                <span
                                    key={`prev-${prevIndex}`}
                                    className="placeholder-option exiting"
                                >
                                    {placeholderOptions[prevIndex]}
                                </span>
                            )}
                            <span
                                key={`curr-${currentIndex}`}
                                className={`placeholder-option ${prevIndex !== null ? 'entering' : ''}`}
                            >
                                {placeholderOptions[currentIndex]}
                            </span>
                        </span>
                    </div>
                )}
            </div>

            {value && (
                <button
                    type="button"
                    className="searchbar-clear-btn"
                    onClick={onClear}
                    aria-label="Clear search"
                >
                    <CloseIcon size={12} strokeWidth={2.5} />
                    <span>Clear</span>
                </button>
            )}
        </>
    );
}

export default SearchInputRow;
