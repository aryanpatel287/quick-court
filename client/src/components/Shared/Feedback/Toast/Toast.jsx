import { useEffect, useState } from 'react';
import './Toast.scss';

// Custom SVGs for Toast states to match clean styling
const SuccessIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const ErrorIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

const WarningIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const InfoIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const CloseIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

function Toast({ message, type = 'info', duration = 4000, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Add small delay to trigger slide-up transition smoothly after mount
        const enterTimer = setTimeout(() => {
            setIsVisible(true);
        }, 50);

        if (duration <= 0) return enterTimer;

        // Start exit transition 400ms before duration expires
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, duration - 400);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(exitTimer);
        };
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose && onClose();
        }, 400); // matches 0.4s transition duration
    };

    const renderIcon = () => {
        switch (type) {
            case 'success':
                return <SuccessIcon />;
            case 'error':
                return <ErrorIcon />;
            case 'warning':
                return <WarningIcon />;
            case 'info':
            default:
                return <InfoIcon />;
        }
    };

    return (
        <div
            className={`shared-toast-item toast-${type} ${isVisible && !isExiting ? 'is-visible' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <div className="toast-message-group">
                <div className={`toast-state-icon-box type-${type}`}>{renderIcon()}</div>
                <span className="toast-selection-text">{message}</span>
            </div>

            <div className="toast-divider" />

            <div
                className="toast-action-group"
                onClick={handleClose}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClose();
                    }
                }}
            >
                <span className={`toast-action-text type-${type} hover-${type}`}>Dismiss</span>
                <div
                    className={`toast-action-icon-box type-${type} hover-${type}`}
                    aria-hidden="true"
                >
                    <CloseIcon />
                </div>
            </div>
        </div>
    );
}

export default Toast;
