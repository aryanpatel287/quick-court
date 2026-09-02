import Toast from '../Toast/Toast';

export default function ToastNotification({ title, message, variant = 'info', type, onClose }) {
    const toastType =
        type ||
        (variant === 'error'
            ? 'error'
            : variant === 'success'
              ? 'success'
              : variant === 'warning'
                ? 'warning'
                : 'info');
    const fullMessage = title ? `${title}: ${message}` : message;

    return <Toast message={fullMessage} type={toastType} onClose={onClose} />;
}
