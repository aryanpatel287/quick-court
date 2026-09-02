import './TableTabs.scss';

function TableTabs({ tabs = [], activeTab, onTabChange, actions = null, className = '' }) {
    return (
        <div className={`table-tabs-container ${className}`}>
            {tabs.length > 0 && (
                <div className="table-tabs-list" role="tablist">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`table-tabs-item ${isActive ? 'active' : ''}`}
                                onClick={() => onTabChange && onTabChange(tab.id)}
                            >
                                {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                                <span className="tab-label">{tab.label}</span>
                                {typeof tab.count === 'number' && (
                                    <span className="tab-count-badge">{tab.count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {actions && <div className="table-tabs-actions">{actions}</div>}
        </div>
    );
}

export default TableTabs;
