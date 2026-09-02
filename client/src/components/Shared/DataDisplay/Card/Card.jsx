import './Card.scss';

export function Card({ children, className = '', ...props }) {
    return (
        <div className={`shared-card ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '', ...props }) {
    return (
        <div className={`shared-card-header ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '', ...props }) {
    return (
        <h3 className={`shared-card-title ${className}`} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className = '', ...props }) {
    return (
        <p className={`shared-card-description ${className}`} {...props}>
            {children}
        </p>
    );
}

export function CardContent({ children, className = '', ...props }) {
    return (
        <div className={`shared-card-content ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '', ...props }) {
    return (
        <div className={`shared-card-footer ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardAction({ children, className = '', ...props }) {
    return (
        <div className={`shared-card-action ${className}`} {...props}>
            {children}
        </div>
    );
}
