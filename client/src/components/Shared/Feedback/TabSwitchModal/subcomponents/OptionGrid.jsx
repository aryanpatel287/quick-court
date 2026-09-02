import './OptionGrid.scss';

/**
 * OptionGrid — Modular 5-column responsive layout grid for options
 */
function OptionGrid({ children, columns = 5, className = '' }) {
    return (
        <div
            className={`option-grid-container cols-${columns} ${className}`}
            style={{ '--grid-cols': columns }}
        >
            {children}
        </div>
    );
}

export default OptionGrid;
