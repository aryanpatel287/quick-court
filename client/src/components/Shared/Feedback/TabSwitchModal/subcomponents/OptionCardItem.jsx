import './OptionCardItem.scss';

/**
 * OptionCardItem — Modular grid card item with active outline border state
 */
function OptionCardItem({ title, subtitle, symbol, isActive = false, onClick, className = '' }) {
    return (
        <button
            type="button"
            className={`option-card-item ${isActive ? 'is-active' : ''} ${className}`}
            onClick={onClick}
            aria-selected={isActive}
        >
            <div className="option-card-content">
                <div className="option-title-row">
                    <span className="option-title">{title}</span>
                    {symbol && <span className="option-symbol">{symbol}</span>}
                </div>
                {subtitle && <span className="option-subtitle">{subtitle}</span>}
            </div>
        </button>
    );
}

export default OptionCardItem;
