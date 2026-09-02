import { useState, useMemo } from 'react';
import SearchBar from '@/components/Shared/Form/SearchBar/SearchBar';
import Checkbox from '@/components/Shared/Form/Checkbox/Checkbox';
import EmptyState from '@/components/Shared/DataDisplay/EmptyState/EmptyState';
import './InlineColumnFilter.scss';

function InlineColumnFilter({ column, allValues, selected, onChange }) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(
        () => allValues.filter((v) => String(v).toLowerCase().includes(search.toLowerCase())),
        [allValues, search],
    );

    const toggle = (val) => {
        if (selected.includes(val)) {
            onChange(selected.filter((x) => x !== val));
        } else {
            onChange([...selected, val]);
        }
    };

    return (
        <div className="at-inline-filter-container">
            {allValues.length > 4 && (
                <div className="at-fdp-search">
                    <SearchBar
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search ${column.label}...`}
                        placeholderOptions={[]}
                    />
                </div>
            )}
            <div className="at-fdp-list">
                {filtered.length === 0 ? (
                    <EmptyState variant="minimal" title="No options found" size="sm" />
                ) : (
                    filtered.map((val) => (
                        <div key={val} className="at-fdp-item">
                            <Checkbox
                                checked={selected.includes(val)}
                                onChange={() => toggle(val)}
                                label={String(val)}
                                className="at-fdp-checkbox"
                            />
                        </div>
                    ))
                )}
            </div>
            {selected.length > 0 && (
                <div className="at-fdp-footer">
                    <button type="button" className="at-fdp-clear" onClick={() => onChange([])}>
                        Clear selection ({selected.length})
                    </button>
                </div>
            )}
        </div>
    );
}

export default InlineColumnFilter;
