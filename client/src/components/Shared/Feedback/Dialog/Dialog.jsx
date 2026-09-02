import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from '@/components/Shared/Buttons/Button/Button';
import './Dialog.scss';

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

function Dialog({
    isOpen = false,
    onClose,
    title,
    variant = 'primary', // primary | danger | success | warning
    size = 'md', // sm | md | lg
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    closeOnBackdrop = true,
    showCloseIcon = true,
    confirmLoading = false,
    confirmDisabled = false,
    children,
}) {
    // Prevent scrolling on background when modal is open
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

    // Close modal on Escape key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !confirmLoading) {
                onClose && onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose, confirmLoading]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        // Only close if user clicked directly on the overlay backdrop
        if (
            closeOnBackdrop &&
            !confirmLoading &&
            e.target.classList.contains('shared-dialog-overlay')
        ) {
            onClose && onClose();
        }
    };

    // Render modal content
    const modalContent = (
        <div className="shared-dialog-overlay" onClick={handleBackdropClick} role="presentation">
            <div
                className={`shared-dialog-card size-${size} variant-${variant}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
            >
                {/* Header */}
                <div className="shared-dialog-header">
                    <h3 id="dialog-title" className="dialog-title-text">
                        {title}
                    </h3>
                    {showCloseIcon && (
                        <button
                            type="button"
                            className="dialog-close-btn"
                            onClick={onClose}
                            aria-label="Close dialog"
                            disabled={confirmLoading}
                        >
                            <CloseIcon />
                        </button>
                    )}
                </div>

                {/* Content Body */}
                <div className="shared-dialog-body">{children}</div>

                {/* Footer Actions */}
                <div className="shared-dialog-footer">
                    {cancelText && (
                        <Button
                            preset="cancel"
                            onClick={onClose}
                            label={cancelText}
                            disabled={confirmLoading}
                        />
                    )}
                    {confirmText && (
                        <Button
                            preset="save"
                            onClick={onConfirm}
                            label={confirmText}
                            variant={variant}
                            loading={confirmLoading}
                            disabled={confirmDisabled || confirmLoading}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    // Mount at document body using React Portals
    return createPortal(modalContent, document.body);
}

export default Dialog;
