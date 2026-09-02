import { useId } from 'react';
import './ToggleButton.scss';

const CheckIcon = () => (
    <svg
        className="toggle-check-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/**
 * ToggleButton — A shared reusable on/off toggle switch component.
 * Updated to feature black capsule track with white thumb disc, dark border outline, and checkmark icon.
 */
function ToggleButton({
    checked = false,
    onChange,
    label,
    labelPos = 'right',
    variant = 'primary',
    size = 'md',
    showCheckmark = true,
    disabled = false,
    id,
    className = '',
}) {
    const defaultId = useId();
    const handleChange = (e) => {
        if (!disabled && onChange) {
            onChange(e.target.checked);
        }
    };

    const rootClass = [
        'toggle-btn-wrapper',
        `toggle-size-${size}`,
        `toggle-variant-${variant}`,
        labelPos === 'left' ? 'label-left' : 'label-right',
        disabled ? 'toggle-disabled' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const inputId = id || defaultId;

    return (
        <label className={rootClass} htmlFor={inputId}>
            {label && labelPos === 'left' && <span className="toggle-label">{label}</span>}

            <div className="toggle-track-wrap">
                <input
                    id={inputId}
                    type="checkbox"
                    className="toggle-input"
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    aria-checked={checked}
                />
                <span className={`toggle-track ${checked ? 'is-on' : 'is-off'}`}>
                    <span className="toggle-thumb">{showCheckmark && <CheckIcon />}</span>
                </span>
            </div>

            {label && labelPos === 'right' && <span className="toggle-label">{label}</span>}
        </label>
    );
}

export default ToggleButton;
