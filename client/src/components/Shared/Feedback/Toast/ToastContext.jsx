import { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';
import './Toast.scss';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(
        (message, type = 'info', duration = 4000) => {
            const id = `${Date.now()}-${Math.floor(performance.now() * 1000)}`;
            setToasts((prev) => [...prev, { id, message, type, duration }]);

            if (duration > 0) {
                setTimeout(() => {
                    removeToast(id);
                }, duration);
            }

            return id;
        },
        [removeToast],
    );

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            {toasts.length > 0 && (
                <div className="shared-toast-container">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    // Return convenient helper methods for general states
    const showToast = useCallback(
        (message, type = 'info', duration) => {
            return context.addToast(message, type, duration);
        },
        [context],
    );

    const success = useCallback(
        (message, duration) => showToast(message, 'success', duration),
        [showToast],
    );
    const error = useCallback(
        (message, duration) => showToast(message, 'error', duration),
        [showToast],
    );
    const warning = useCallback(
        (message, duration) => showToast(message, 'warning', duration),
        [showToast],
    );
    const info = useCallback(
        (message, duration) => showToast(message, 'info', duration),
        [showToast],
    );

    return {
        toasts: context.toasts,
        showToast,
        removeToast: context.removeToast,
        success,
        error,
        warning,
        info,
    };
}
