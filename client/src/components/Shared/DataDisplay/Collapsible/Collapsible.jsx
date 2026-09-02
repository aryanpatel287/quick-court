import { useState, createContext, useContext, useMemo } from 'react';

const CollapsibleContext = createContext(null);

export function Collapsible({
    children,
    defaultOpen = false,
    open,
    onOpenChange,
    className = '',
    ...props
}) {
    const [localOpen, setLocalOpen] = useState(defaultOpen);
    const isOpen = open !== undefined ? open : localOpen;
    const setIsOpen = onOpenChange !== undefined ? onOpenChange : setLocalOpen;

    const contextValue = useMemo(() => ({ isOpen, setIsOpen }), [isOpen, setIsOpen]);

    return (
        <CollapsibleContext.Provider value={contextValue}>
            <div
                className={`shared-collapsible ${className}`}
                data-state={isOpen ? 'open' : 'closed'}
                {...props}
            >
                {children}
            </div>
        </CollapsibleContext.Provider>
    );
}

export function CollapsibleTrigger({ children, onClick, className = '', ...props }) {
    const { isOpen, setIsOpen } = useContext(CollapsibleContext);

    const handleToggle = (e) => {
        setIsOpen(!isOpen);
        if (onClick) onClick(e);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleToggle}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle(e);
                }
            }}
            className={`shared-collapsible-trigger ${className}`}
            data-state={isOpen ? 'open' : 'closed'}
            {...props}
        >
            {children}
        </div>
    );
}

export function CollapsibleContent({ children, className = '', ...props }) {
    const { isOpen } = useContext(CollapsibleContext);

    if (!isOpen) return null;

    return (
        <div
            className={`shared-collapsible-content ${className}`}
            data-state={isOpen ? 'open' : 'closed'}
            {...props}
        >
            {children}
        </div>
    );
}
