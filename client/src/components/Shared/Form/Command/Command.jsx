import { useState, createContext, useContext } from 'react';
import { SearchIcon } from 'lucide-react';
import './Command.scss';

const CommandContext = createContext({
    search: '',
    setSearch: () => {},
});

export function Command({ className = '', children, ...props }) {
    const [search, setSearch] = useState('');
    return (
        <CommandContext.Provider value={{ search, setSearch }}>
            <div className={`shared-command ${className}`} {...props}>
                {children}
            </div>
        </CommandContext.Provider>
    );
}

export function CommandInput({ className = '', value, onValueChange, ...props }) {
    const { search, setSearch } = useContext(CommandContext);

    const handleChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        onValueChange?.(val);
    };

    return (
        <div className="shared-command-input-wrapper">
            <input
                type="text"
                className={`shared-command-input ${className}`}
                value={value ?? search}
                onChange={handleChange}
                {...props}
            />
            <div className="shared-command-search-icon">
                <SearchIcon size={16} />
            </div>
        </div>
    );
}

export function CommandList({ className = '', ...props }) {
    return <div className={`shared-command-list ${className}`} {...props} />;
}

export function CommandEmpty({ className = '', children, ...props }) {
    return (
        <div className={`shared-command-empty ${className}`} {...props}>
            {children ?? 'No results found.'}
        </div>
    );
}

export function CommandGroup({ className = '', ...props }) {
    return <div className={`shared-command-group ${className}`} {...props} />;
}

export function CommandSeparator({ className = '', ...props }) {
    return <div className={`shared-command-separator ${className}`} {...props} />;
}

export function CommandItem({ className = '', children, onSelect, ...props }) {
    const handleSelect = (e) => {
        if (onSelect) {
            onSelect(e);
        }
    };

    return (
        <div
            className={`shared-command-item ${className}`}
            onClick={handleSelect}
            style={{ cursor: 'pointer' }}
            {...props}
        >
            {children}
        </div>
    );
}
