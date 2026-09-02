import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X as CloseIcon } from 'lucide-react';
import './Drawer.scss';

/**
 * Shared Modular Drawer Component
 * Supports 4 slide directions ('right', 'left', 'top', 'bottom')
 * and flexible sizing ('sm', 'md', 'lg', 'xl', 'full').
 */
function Drawer({
    isOpen = false,
    onClose,
    title,
    subtitle,
    position = 'right', // 'right' | 'left' | 'top' | 'bottom'
    size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
    showOverlay = true,
    closeOnOverlayClick = true,
    closeOnEsc = true,
    showCloseIcon = true,
    headerActions,
    footer,
    className = '',
    children,
}) {
    // Prevent background scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && closeOnEsc) {
                onClose && onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEsc, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (closeOnOverlayClick && e.target.classList.contains('shared-drawer-overlay')) {
            onClose && onClose();
        }
    };

    const drawerContent = (
        <div
            className={`shared-drawer-overlay ${showOverlay ? 'with-backdrop' : 'no-backdrop'}`}
            onClick={handleOverlayClick}
            role="presentation"
        >
            <div
                className={`shared-drawer-panel position-${position} size-${size} ${className}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'drawer-title' : undefined}
            >
                {/* Drawer Header */}
                {(title || showCloseIcon || headerActions) && (
                    <div className="shared-drawer-header">
                        <div className="drawer-header-left">
                            {title && (
                                <h3 id="drawer-title" className="drawer-title-text">
                                    {title}
                                </h3>
                            )}
                            {subtitle && <p className="drawer-subtitle-text">{subtitle}</p>}
                        </div>

                        <div className="drawer-header-right">
                            {headerActions && (
                                <div className="drawer-header-actions">{headerActions}</div>
                            )}

                            {showCloseIcon && (
                                <button
                                    type="button"
                                    className="drawer-close-btn"
                                    onClick={onClose}
                                    aria-label="Close drawer"
                                    title="Close"
                                >
                                    <CloseIcon size={18} strokeWidth={2} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Drawer Body Content */}
                <div className="shared-drawer-body">{children}</div>

                {/* Optional Sticky Footer */}
                {footer && <div className="shared-drawer-footer">{footer}</div>}
            </div>
        </div>
    );

    return createPortal(drawerContent, document.body);
}

export default Drawer;
