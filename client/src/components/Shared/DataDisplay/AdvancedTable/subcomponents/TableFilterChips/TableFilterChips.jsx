import { X as CloseIcon } from 'lucide-react';
import './TableFilterChips.scss';

function TableFilterChips({ activeChips = [], clearAllFilters }) {
    if (!activeChips || activeChips.length === 0) return null;

    return (
        <div className="at-filter-chips-bar">
            <span className="at-chips-label">Active filters:</span>
            <div className="at-chips-list">
                {activeChips.map((chip) => (
                    <div key={chip.id} className="at-filter-chip">
                        <span className="at-chip-label">{chip.label}</span>
                        <button
                            type="button"
                            className="at-chip-remove"
                            onClick={chip.onRemove}
                            aria-label={`Remove filter: ${chip.label}`}
                        >
                            <CloseIcon size={11} strokeWidth={2.5} />
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" className="at-chips-clear-all" onClick={clearAllFilters}>
                Clear all
            </button>
        </div>
    );
}

export default TableFilterChips;
