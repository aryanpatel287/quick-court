import { useRef, useState, useEffect } from 'react';
import './ModalTabNav.scss';

/**
 * ModalTabNav — Modular tab navigation with sleek smooth sliding dark underline indicator
 */
function ModalTabNav({ tabs = [], activeTab, onTabChange, className = '' }) {
    const tabsRef = useRef({});
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const updateIndicator = () => {
            const activeNode = tabsRef.current[activeTab];
            if (activeNode) {
                setIndicatorStyle({
                    left: activeNode.offsetLeft,
                    width: activeNode.offsetWidth,
                });
            }
        };

        updateIndicator();
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
    }, [activeTab, tabs]);

    if (!tabs || tabs.length === 0) return null;

    return (
        <div className={`modal-tab-nav-container ${className}`}>
            <div className="modal-tab-nav-list" role="tablist">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            ref={(el) => (tabsRef.current[tab.id] = el)}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`modal-tab-item ${isActive ? 'is-active' : ''}`}
                            onClick={() => onTabChange && onTabChange(tab.id)}
                        >
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    );
                })}
                {/* Animated Sliding Underline Bar */}
                <span
                    className="modal-tab-active-indicator"
                    style={{
                        left: `${indicatorStyle.left}px`,
                        width: `${indicatorStyle.width}px`,
                    }}
                />
            </div>
            <div className="modal-tab-nav-divider" />
        </div>
    );
}

export default ModalTabNav;
