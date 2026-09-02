import './Alert.scss';

export function Alert({ children, variant = 'info', className = '', ...props }) {
    return (
        <div className={`shared-alert variant-${variant} ${className}`} role="alert" {...props}>
            {children}
        </div>
    );
}

export function AlertTitle({ children, className = '', ...props }) {
    return (
        <h4 className={`shared-alert-title ${className}`} {...props}>
            {children}
        </h4>
    );
}

export function AlertDescription({ children, className = '', ...props }) {
    return (
        <div className={`shared-alert-description ${className}`} {...props}>
            {children}
        </div>
    );
}
