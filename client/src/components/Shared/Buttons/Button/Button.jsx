import { isValidElement } from 'react';
import {
    Trash2 as TrashIcon,
    RotateCcw as ResetIcon,
    Eraser as EraserIcon,
    AlertTriangle as WarningIcon,
} from 'lucide-react';
import './Button.scss';

const TrashSvg = () => (
    <svg
        className="delete-btn-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const EditSvg = () => (
    <svg
        className="edit-btn-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

const RightArrowSvg = () => (
    <svg
        className="next-arrow-svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const LeftArrowSvg = () => (
    <svg
        className="prev-arrow-svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

function Button({
    children,
    label,
    type = 'button',
    variant = 'primary',
    size = 'lg',
    circle = false,
    fullWidth = false,
    icon,
    onClick,
    disabled = false,
    loading = false,
    className = '',
    preset,
    count,
    showText = true,
    ...props
}) {
    // Resolve configurations dynamically based on preset
    let resolvedVariant = variant;
    let resolvedChildren = children ?? label;
    let resolvedIcon = icon;
    let resolvedClassName = className;
    let resolvedSize = size;
    let resolvedCircle = circle;

    if (preset === 'cancel') {
        resolvedVariant = 'muted';
        resolvedChildren = children ?? label ?? 'Cancel';
        resolvedClassName = `shared-cancel-btn ${className}`;
        resolvedSize = size === 'lg' ? 'md' : size; // Defaults to md size
    } else if (preset === 'save') {
        resolvedVariant = variant;
        resolvedChildren = children ?? label ?? 'Save Details';
        resolvedClassName = `shared-save-details-btn ${className}`;
    } else if (preset === 'delete') {
        resolvedVariant = 'danger-light';
        resolvedChildren = children ?? label ?? 'Delete';
        resolvedIcon = icon ?? <TrashSvg />;
        resolvedClassName = `shared-delete-btn ${className}`;
    } else if (preset === 'edit') {
        resolvedVariant = 'edit-light';
        resolvedChildren = children ?? label ?? 'Edit';
        resolvedIcon = icon ?? <EditSvg />;
        resolvedClassName = `shared-edit-btn ${className}`;
    } else if (preset === 'next') {
        resolvedVariant = 'secondary';
        resolvedChildren = showText ? (children ?? label ?? 'Next') : null;
        resolvedIcon = icon ?? <RightArrowSvg />;
        resolvedClassName = `pagination-next-btn ${!showText ? 'icon-only' : ''} ${className}`;
    } else if (preset === 'prev') {
        resolvedVariant = 'secondary';
        resolvedChildren = showText ? (children ?? label ?? 'Previous') : null;
        resolvedIcon = icon ?? <LeftArrowSvg />;
        resolvedClassName = `pagination-prev-btn ${!showText ? 'icon-only' : ''} ${className}`;
    } else if (preset === 'clear-all') {
        resolvedVariant = variant === 'primary' ? 'neutral' : variant;
        resolvedChildren = children ?? label ?? 'Clear All';
        resolvedClassName = `shared-clear-all-btn variant-${resolvedVariant} ${className}`;
        if (!icon) {
            switch (resolvedVariant) {
                case 'danger':
                    resolvedIcon = <TrashIcon className="clear-btn-icon" />;
                    break;
                case 'warning':
                    resolvedIcon = <WarningIcon className="clear-btn-icon" />;
                    break;
                case 'info':
                    resolvedIcon = <ResetIcon className="clear-btn-icon" />;
                    break;
                case 'neutral':
                default:
                    resolvedIcon = <EraserIcon className="clear-btn-icon" />;
                    break;
            }
        }
    } else if (preset === 'icon') {
        resolvedVariant = variant === 'primary' ? 'plain' : variant;
        resolvedClassName = `shared-icon-button ${resolvedVariant} ${className}`;
        resolvedCircle = true;
    }

    const isButtonDisabled = disabled || loading;
    const isPxSize = typeof resolvedSize === 'number';

    // Renders the correct standard and custom classes
    const classes = [
        preset === 'clear-all' ? '' : 'btn',
        preset === 'clear-all' ? '' : `btn-${resolvedVariant}`,
        !isPxSize && resolvedSize !== 'lg' ? `btn-${resolvedSize}` : '',
        resolvedCircle ? 'btn-circle' : '',
        fullWidth ? 'btn-full-width' : '',
        isButtonDisabled ? 'is-disabled' : '',
        loading ? 'btn-loading' : '',
        resolvedClassName,
    ]
        .filter(Boolean)
        .join(' ');

    const showChildren = !(loading && (resolvedSize === 'icon' || resolvedSize === 'icon-sm'));

    const renderIcon = () => {
        if (!resolvedIcon || loading) return null;
        if (isValidElement(resolvedIcon)) {
            if (preset === 'icon') {
                return <span className="icon-wrapper">{resolvedIcon}</span>;
            }
            return resolvedIcon;
        }
        if (
            typeof resolvedIcon === 'function' ||
            (typeof resolvedIcon === 'object' && resolvedIcon.$$typeof)
        ) {
            const IconComp = resolvedIcon;
            return <IconComp size={16} className="btn-icon" />;
        }
        return null;
    };

    const style = {
        ...props.style,
        ...(isPxSize
            ? {
                  width: `${resolvedSize}px`,
                  height: `${resolvedSize}px`,
                  minWidth: `${resolvedSize}px`,
                  padding: 0,
              }
            : {}),
    };

    const iconPosition = preset === 'next' ? 'after' : 'before';

    return (
        <button
            type={type}
            disabled={isButtonDisabled}
            className={classes}
            onClick={onClick}
            style={style}
            {...props}
        >
            {loading && (
                <span className="btn-spinner" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </span>
            )}
            {iconPosition === 'before' && preset !== 'clear-all' && renderIcon()}
            {preset === 'clear-all' ? (
                <>
                    {renderIcon()}
                    <span className="clear-btn-label">{resolvedChildren}</span>
                    {typeof count === 'number' && <span className="clear-btn-count">{count}</span>}
                </>
            ) : (
                showChildren && resolvedChildren
            )}
            {iconPosition === 'after' && renderIcon()}
        </button>
    );
}

export default Button;
