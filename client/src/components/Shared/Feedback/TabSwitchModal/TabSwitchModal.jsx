import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ModalTabNav from './subcomponents/ModalTabNav';
import './TabSwitchModal.scss';

// Default Tabs
const DEFAULT_TABS = [
    { id: 'tab1', label: 'Tab1' },
    { id: 'tab2', label: 'Tab2' },
    { id: 'tab3', label: 'Tab3' },
    { id: 'tab4', label: 'Tab4' },
    { id: 'tab5', label: 'Tab5' },
];

/**
 * TabSwitchModal — Clean, modular tab switch modal component matching exact layout,
 * background color (#ffffff main, #f7f7f7 callout banner), border radius (28px/32px),
 * spacing, roundness, and reusing shared components.
 */
function TabSwitchModal({
    isOpen = false,
    onClose,
    tabs = DEFAULT_TABS,
    activeTab: controlledActiveTab,
    onTabChange: controlledOnTabChange,
    closeOnBackdrop = true,
    className = '',
    children,
}) {
    // Internal fallback state for uncontrolled usage
    const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || 'tab1');

    const currentTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

    // Handle body overflow locking
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
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose && onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleTabSwitch = (tabId) => {
        if (controlledOnTabChange) {
            controlledOnTabChange(tabId);
        } else {
            setInternalActiveTab(tabId);
        }
    };

    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target.classList.contains('tab-modal-overlay')) {
            onClose && onClose();
        }
    };

    const modalMarkup = (
        <div className="tab-modal-overlay" onClick={handleBackdropClick} role="presentation">
            <div className={`tab-modal-card ${className}`} role="dialog" aria-modal="true">
                {/* Modal Top Header with Close Button */}
                <div className="tab-modal-header">
                    <button
                        type="button"
                        className="tab-modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={18} strokeWidth={2.2} />
                    </button>
                </div>

                {/* Tab Navigation Header */}
                <ModalTabNav tabs={tabs} activeTab={currentTab} onTabChange={handleTabSwitch} />

                {/* Scrollable Modal Content Body */}
                <div className="tab-modal-body">{children || null}</div>
            </div>
        </div>
    );

    return createPortal(modalMarkup, document.body);
}

export default TabSwitchModal;
