import { useState, useEffect, useRef, useCallback } from 'react';
import {
    ChevronDown as ChevronDownIcon,
    X as CloseIcon,
    Search as SearchIcon,
    Check as CheckIcon,
} from 'lucide-react';
import EmptyState from '@/components/Shared/DataDisplay/EmptyState/EmptyState';
import { useClickOutside } from '@/hooks/useClickOutside';
import './Dropdown.scss';

/**
 * Normalizes options array into standard option object structures
 */
function normalizeOptions(options = []) {
    return options.map((opt, index) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
            return {
                value: opt,
                label: String(opt),
                disabled: false,
                index,
                original: opt,
            };
        }
        return {
            value: opt.value,
            label: opt.label ?? String(opt.value),
            icon: opt.icon,
            disabled: !!opt.disabled,
            description: opt.description,
            index,
            original: opt,
        };
    });
}

/**
 * Dropdown Selected Display Micro-Subcomponent
 * Renders selected option title, leading icon, or placeholder text.
 */
function DropdownSelectedDisplay({ selectedOption, placeholder }) {
    return (
        <div className="shared-dropdown-selected">
            {selectedOption ? (
                <>
                    {selectedOption.icon && (
                        <selectedOption.icon className="shared-dropdown-selected-icon" />
                    )}
                    <span className="shared-dropdown-selected-title">{selectedOption.label}</span>
                </>
            ) : (
                <span className="shared-dropdown-placeholder">{placeholder}</span>
            )}
        </div>
    );
}

/**
 * Dropdown Actions Micro-Subcomponent
 * Renders clear action button and chevron indicator icon.
 */
function DropdownActions({ clearable, selectedOption, disabled, onClear }) {
    return (
        <div className="shared-dropdown-actions">
            {clearable && selectedOption && !disabled && (
                <button
                    type="button"
                    className="shared-dropdown-clear-btn"
                    onClick={onClear}
                    aria-label="Clear selection"
                >
                    <CloseIcon size={12} />
                </button>
            )}
            <ChevronDownIcon size={16} className="shared-dropdown-chevron" />
        </div>
    );
}

/**
 * Dropdown Trigger Subcomponent
 * Composes DropdownSelectedDisplay and DropdownActions.
 */
function DropdownTrigger({
    selectedOption,
    placeholder,
    isOpen,
    disabled,
    clearable,
    error,
    setTriggerRef,
    onToggle,
    onClear,
}) {
    return (
        <button
            type="button"
            ref={setTriggerRef}
            className={`shared-dropdown-trigger ${isOpen ? 'is-open' : ''}`}
            disabled={disabled}
            onClick={onToggle}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-invalid={!!error}
        >
            <DropdownSelectedDisplay selectedOption={selectedOption} placeholder={placeholder} />

            <DropdownActions
                clearable={clearable}
                selectedOption={selectedOption}
                disabled={disabled}
                onClear={onClear}
            />
        </button>
    );
}

/**
 * Dropdown Search Input Subcomponent
 * Renders search bar inside the dropdown popover menu when searchable is enabled.
 */
function DropdownSearchInput({ searchInputRef, searchQuery, onSearchChange, disabled }) {
    return (
        <div className="shared-dropdown-search-wrapper">
            <SearchIcon size={16} className="shared-dropdown-search-icon" />
            <input
                type="text"
                ref={searchInputRef}
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search..."
                className="shared-dropdown-search-input"
                disabled={disabled}
            />
        </div>
    );
}

/**
 * Dropdown Option Item Subcomponent
 * Renders individual list item option with custom render support, icon, label, description, and selected checkmark.
 */
function DropdownOptionItem({ option, isSelected, isFocused, renderOption, onOptionClick }) {
    if (renderOption) {
        return (
            <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onClick={() => onOptionClick(option)}
                className={`shared-dropdown-item ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''} ${option.disabled ? 'is-disabled' : ''}`}
            >
                {renderOption(option.original, isSelected, isFocused)}
            </li>
        );
    }

    return (
        <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            aria-disabled={option.disabled}
            disabled={option.disabled}
            onClick={() => onOptionClick(option)}
            className={`shared-dropdown-item ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''} ${option.disabled ? 'is-disabled' : ''}`}
            tabIndex={-1}
        >
            {option.icon && <option.icon className="shared-dropdown-item-icon" />}
            <div className="shared-dropdown-item-label-group">
                <span className="shared-dropdown-item-label">{option.label}</span>
                {option.description && (
                    <span className="shared-dropdown-item-description">{option.description}</span>
                )}
            </div>
            {isSelected && <CheckIcon size={16} className="shared-dropdown-item-checkmark" />}
        </button>
    );
}

/**
 * Dropdown Empty State Subcomponent
 * Renders fallback UI when dropdown search results are empty.
 */
function DropdownEmptyState({ message = 'No options found' }) {
    return (
        <div className="shared-dropdown-no-results">
            <EmptyState variant="minimal" title={message} size="sm" />
        </div>
    );
}

/**
 * Dropdown List Micro-Subcomponent
 * Renders scrollable options list or empty state.
 */
function DropdownList({
    listRef,
    maxHeight,
    filteredOptions,
    selectedValue,
    focusedIndex,
    renderOption,
    onOptionClick,
}) {
    return (
        <ul
            ref={listRef}
            className="shared-dropdown-list"
            style={{ maxHeight }}
            role="listbox"
            tabIndex={-1}
        >
            {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => {
                    const isSelected = selectedValue === option.value;
                    const isFocused = idx === focusedIndex;

                    return (
                        <DropdownOptionItem
                            key={option.value}
                            option={option}
                            isSelected={isSelected}
                            isFocused={isFocused}
                            renderOption={renderOption}
                            onOptionClick={onOptionClick}
                        />
                    );
                })
            ) : (
                <DropdownEmptyState />
            )}
        </ul>
    );
}

/**
 * Dropdown Menu Subcomponent
 * Composes DropdownSearchInput and DropdownList.
 */
function DropdownMenuList({
    isOpen,
    searchable,
    searchInputRef,
    searchQuery,
    onSearchChange,
    disabled,
    listRef,
    maxHeight,
    filteredOptions,
    selectedValue,
    focusedIndex,
    renderOption,
    onOptionClick,
}) {
    return (
        <div className={`shared-dropdown-menu ${isOpen ? 'is-open' : ''}`}>
            {searchable && (
                <DropdownSearchInput
                    searchInputRef={searchInputRef}
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    disabled={disabled}
                />
            )}

            <DropdownList
                listRef={listRef}
                maxHeight={maxHeight}
                filteredOptions={filteredOptions}
                selectedValue={selectedValue}
                focusedIndex={focusedIndex}
                renderOption={renderOption}
                onOptionClick={onOptionClick}
            />
        </div>
    );
}

/**
 * Shared Modular Dropdown Component
 * Converted from a multi-file granular structure to a clean, single-file implementation.
 */
function Dropdown({
    label,
    placeholder = 'Select an option',
    options = [],
    value,
    onChange,
    disabled = false,
    error,
    searchable = false,
    clearable = false,
    className = '',
    maxHeight = '250px',
    renderOption,
    triggerRef: externalTriggerRef,
    dropdownId,
    onSearchChange,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const searchInputRef = useRef(null);
    const listRef = useRef(null);

    const setTriggerRef = useCallback(
        (element) => {
            triggerRef.current = element;
            if (externalTriggerRef) {
                if (typeof externalTriggerRef === 'function') {
                    externalTriggerRef(element);
                } else if ('current' in externalTriggerRef) {
                    externalTriggerRef.current = element;
                }
            }
        },
        [externalTriggerRef],
    );

    // Normalize options to object format using local function
    const normalizedOptions = normalizeOptions(options);

    // Filter options based on search query
    const filteredOptions = normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Find currently selected option
    const selectedOption = normalizedOptions.find((opt) => opt.value === value);

    // Handle click outside to close dropdown
    useClickOutside(dropdownRef, () => setIsOpen(false), { enabled: isOpen });

    // Sync focused index and search focus on open
    useEffect(() => {
        if (isOpen) {
            const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value);
            if (selectedIdx >= 0) {
                setFocusedIndex(selectedIdx);
            } else {
                const firstEnabled = filteredOptions.findIndex((opt) => !opt.disabled);
                setFocusedIndex(firstEnabled >= 0 ? firstEnabled : 0);
            }

            if (searchable) {
                const timer = setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 60);
                return () => clearTimeout(timer);
            }
        } else {
            setSearchQuery('');
            setFocusedIndex(-1);
        }
    }, [isOpen, searchable, value, searchQuery]);

    // Auto-scroll list items when navigating via keyboard
    useEffect(() => {
        if (focusedIndex >= 0 && listRef.current) {
            const listEl = listRef.current;
            const focusedEl = listEl.children[focusedIndex];
            if (focusedEl) {
                const listHeight = listEl.clientHeight;
                const itemTop = focusedEl.offsetTop;
                const itemHeight = focusedEl.offsetHeight;
                const scrollTop = listEl.scrollTop;

                if (itemTop + itemHeight > scrollTop + listHeight) {
                    listEl.scrollTop = itemTop + itemHeight - listHeight;
                } else if (itemTop < scrollTop) {
                    listEl.scrollTop = itemTop;
                }
            }
        }
    }, [focusedIndex]);

    const toggleDropdown = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (option) => {
        if (option.disabled) return;
        if (onChange) {
            onChange(option.value, option.original);
        }
        setIsOpen(false);
        triggerRef.current?.focus();
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (disabled) return;
        if (onChange) {
            onChange(undefined, null);
        }
        setIsOpen(false);
        triggerRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    const focusedOpt = filteredOptions[focusedIndex];
                    if (focusedOpt) {
                        handleOptionClick(focusedOpt);
                    }
                }
                break;

            case ' ':
                if (searchable && document.activeElement === searchInputRef.current) {
                    return;
                }
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    const focusedOpt = filteredOptions[focusedIndex];
                    if (focusedOpt) {
                        handleOptionClick(focusedOpt);
                    }
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setFocusedIndex((prev) => {
                        let next = prev + 1;
                        while (next < filteredOptions.length && filteredOptions[next].disabled) {
                            next++;
                        }
                        return next < filteredOptions.length ? next : prev;
                    });
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setFocusedIndex((prev) => {
                        let prevIdx = prev - 1;
                        while (prevIdx >= 0 && filteredOptions[prevIdx].disabled) {
                            prevIdx--;
                        }
                        return prevIdx >= 0 ? prevIdx : prev;
                    });
                }
                break;

            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                triggerRef.current?.focus();
                break;

            case 'Tab':
                setIsOpen(false);
                break;

            default:
                break;
        }
    };

    return (
        <div
            className={`shared-dropdown-container ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
            ref={dropdownRef}
            onKeyDown={handleKeyDown}
        >
            {label && <label className="shared-dropdown-label">{label}</label>}
            <div className="shared-dropdown">
                {/* 1. Dropdown Trigger Subcomponent */}
                <DropdownTrigger
                    selectedOption={selectedOption}
                    placeholder={placeholder}
                    isOpen={isOpen}
                    disabled={disabled}
                    clearable={clearable}
                    error={error}
                    setTriggerRef={setTriggerRef}
                    onToggle={toggleDropdown}
                    onClear={handleClear}
                />

                {/* 2. Dropdown Menu Subcomponent */}
                <DropdownMenuList
                    isOpen={isOpen}
                    searchable={searchable}
                    searchInputRef={searchInputRef}
                    searchQuery={searchQuery}
                    onSearchChange={(e) => {
                        setSearchQuery(e.target.value);
                        setFocusedIndex(0);
                    }}
                    disabled={disabled}
                    listRef={listRef}
                    maxHeight={maxHeight}
                    filteredOptions={filteredOptions}
                    selectedValue={value}
                    focusedIndex={focusedIndex}
                    renderOption={renderOption}
                    onOptionClick={handleOptionClick}
                />
            </div>
            {error && <span className="shared-dropdown-error-message">{error}</span>}
        </div>
    );
}

export default Dropdown;
