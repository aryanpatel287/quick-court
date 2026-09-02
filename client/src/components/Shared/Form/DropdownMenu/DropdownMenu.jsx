import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import Button from '@/components/Shared/Buttons/Button/Button';
import './DropdownMenu.scss';

const DropdownMenuContext = createContext(null);

export function DropdownMenu({ children, open, onOpenChange, ...props }) {
    const [localOpen, setLocalOpen] = useState(false);
    const isOpen = open !== undefined ? open : localOpen;
    const setIsOpen = onOpenChange !== undefined ? onOpenChange : setLocalOpen;
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, setIsOpen]);

    const contextValue = useMemo(() => ({ isOpen, setIsOpen }), [isOpen, setIsOpen]);

    return (
        <DropdownMenuContext.Provider value={contextValue}>
            <div ref={dropdownRef} className="shared-dropdown-menu-wrapper" {...props}>
                {children}
            </div>
        </DropdownMenuContext.Provider>
    );
}

export function DropdownMenuTrigger({ children, onClick, render, ...props }) {
    const { isOpen, setIsOpen } = useContext(DropdownMenuContext);

    const handleToggle = (e) => {
        setIsOpen(!isOpen);
        if (onClick) onClick(e);
    };

    if (render) {
        return React.cloneElement(render, {
            onClick: handleToggle,
            ...props,
        });
    }

    return (
        <Button
            type="button"
            onClick={handleToggle}
            className={`shared-dropdown-trigger ${props.className || ''}`}
            {...props}
        >
            {children}
        </Button>
    );
}

export function DropdownMenuContent({ children, className = '', align = 'start', ...props }) {
    const { isOpen } = useContext(DropdownMenuContext);

    if (!isOpen) return null;

    return (
        <div className={`shared-dropdown-menu-content align-${align} ${className}`} {...props}>
            {children}
        </div>
    );
}

export function DropdownMenuItem({ children, onClick, render, className = '', ...props }) {
    const { setIsOpen } = useContext(DropdownMenuContext);

    const handleClick = (e) => {
        if (onClick) onClick(e);
        setIsOpen(false);
    };

    if (render) {
        return React.cloneElement(render, {
            onClick: handleClick,
            className: `shared-dropdown-menu-item ${render.props.className || ''} ${className}`,
            children: render.props.children || children,
            ...props,
        });
    }

    return (
        <div
            role="menuitem"
            tabIndex={0}
            onClick={handleClick}
            className={`shared-dropdown-menu-item ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function DropdownMenuLabel({ children, className = '', ...props }) {
    return (
        <div className={`shared-dropdown-menu-label ${className}`} {...props}>
            {children}
        </div>
    );
}

export function DropdownMenuSeparator({ className = '', ...props }) {
    return <div className={`shared-dropdown-menu-separator ${className}`} {...props} />;
}
