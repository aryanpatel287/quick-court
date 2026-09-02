import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.scss';

/**
 * Tooltip Component
 *
 * Supports two rendering modes:
 * - Default (usePortal=false): tooltip bubble is a child of the wrapper div.
 *   Simple and works for most cases.
 * - Portal (usePortal=true): tooltip bubble is rendered into document.body via
 *   a React Portal. This bypasses any overflow:hidden/auto ancestors (e.g. table
 *   scroll containers, sticky headers) that would clip the tooltip.
 */
function Tooltip({
    content,
    position = 'top',
    children,
    className = '',
    visible = false,
    usePortal = false,
    variant = 'default',
}) {
    if (!content) return <>{children}</>;

    if (!usePortal) {
        // Original behaviour — simple CSS-based tooltip
        return (
            <div className={`tooltip-wrapper ${className} ${visible ? 'is-visible' : ''}`}>
                {children}
                <div
                    className={`tooltip-bubble tooltip-${position} ${visible ? 'is-visible' : ''} ${variant === 'flat' ? 'variant-flat' : ''}`}
                >
                    {content}
                    <span className="tooltip-arrow"></span>
                </div>
            </div>
        );
    }

    // Portal mode: bubble is appended to document.body at fixed screen coords
    return (
        <PortalTooltip
            content={content}
            position={position}
            className={className}
            variant={variant}
        >
            {children}
        </PortalTooltip>
    );
}

function PortalTooltip({ content, position, className, children, variant }) {
    const [show, setShow] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const isHoveredRef = useRef(false);
    const isFocusedRef = useRef(false);
    const GAP = 8; // px gap between trigger and bubble

    const computeCoords = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();

        let top;
        let left;

        switch (position) {
            case 'top':
                top = rect.top - GAP;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + GAP;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - GAP;
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + GAP;
                break;
            default:
                top = rect.top - GAP;
                left = rect.left + rect.width / 2;
        }

        setCoords({ top, left });
    }, [position]);

    const handleMouseEnter = () => {
        isHoveredRef.current = true;
        computeCoords();
        setShow(true);
    };

    const handleMouseLeave = () => {
        isHoveredRef.current = false;
        if (!isFocusedRef.current) {
            setShow(false);
        }
    };

    const handleFocus = () => {
        isFocusedRef.current = true;
        computeCoords();
        setShow(true);
    };

    const handleBlur = () => {
        isFocusedRef.current = false;
        if (!isHoveredRef.current) {
            setShow(false);
        }
    };

    // Recompute on scroll/resize while visible
    useEffect(() => {
        if (!show) return;
        const update = () => computeCoords();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [show, computeCoords]);

    const bubble = show ? (
        <div
            className={`tooltip-portal-bubble tooltip-portal-${position} ${className} ${variant === 'flat' ? 'variant-flat' : ''}`}
            style={{ top: coords.top, left: coords.left }}
            role="tooltip"
        >
            {content}
            <span className="tooltip-arrow"></span>
        </div>
    ) : null;

    return (
        <>
            <span
                ref={triggerRef}
                className={`tooltip-portal-trigger`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={handleFocus}
                onBlur={handleBlur}
            >
                {children}
            </span>
            {typeof document !== 'undefined' && createPortal(bubble, document.body)}
        </>
    );
}

export default Tooltip;
