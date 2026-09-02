import './Logo.scss';

export default function Logo({
    variant = 'full', // 'full' | 'icon' | 'text'
    size = 'md', // 'sm' | 'md' | 'lg'
    className = '',
    ...props
}) {
    return (
        <div
            className={`apex-logo-brand size-${size} variant-${variant} ${className}`.trim()}
            {...props}
        >
            {(variant === 'full' || variant === 'icon') && (
                <div className="logo-symbol" aria-hidden="true">
                    <svg
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="logo-svg"
                    >
                        <defs>
                            <linearGradient
                                id="apex-grad-primary"
                                x1="2"
                                y1="2"
                                x2="30"
                                y2="30"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="50%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                            <linearGradient
                                id="apex-grad-accent"
                                x1="30"
                                y1="2"
                                x2="2"
                                y2="30"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M16 3L29 26H21.5L16 15.5L10.5 26H3L16 3Z"
                            fill="url(#apex-grad-primary)"
                        />
                        <path
                            d="M16 11L22.5 24H18.5L16 19L13.5 24H9.5L16 11Z"
                            fill="url(#apex-grad-accent)"
                            fillOpacity="0.85"
                        />
                    </svg>
                </div>
            )}
            {(variant === 'full' || variant === 'text') && (
                <div className="logo-text-group">
                    <span className="logo-brand-name">Apex</span>
                    <span className="logo-brand-suffix">Template</span>
                </div>
            )}
        </div>
    );
}
