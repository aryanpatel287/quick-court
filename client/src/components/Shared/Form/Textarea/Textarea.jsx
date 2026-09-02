import { useRef, useEffect } from 'react';
import './Textarea.scss';

function Textarea({
    label,
    id,
    placeholder,
    value = '',
    onChange,
    rows = 4,
    maxLength,
    resize = 'vertical',
    autoResize = false,
    error,
    hint,
    disabled = false,
    required = false,
    textareaRef,
    className = '',
}) {
    const internalRef = useRef(null);
    const ref = textareaRef || internalRef;

    // Auto-grow: recalculate height whenever value changes
    useEffect(() => {
        if (!autoResize || !ref.current) return;
        const el = ref.current;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [value, autoResize, ref]);

    const charCount = value ? value.length : 0;
    const isNearLimit = maxLength && charCount >= maxLength * 0.85;
    const isAtLimit = maxLength && charCount >= maxLength;

    const rootClass = [
        'textarea-group',
        error ? 'has-error' : '',
        disabled ? 'is-disabled' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={rootClass}>
            {label && (
                <label htmlFor={id} className="textarea-label">
                    {label}
                    {required && (
                        <span className="textarea-required" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}

            <div className="textarea-wrapper">
                <textarea
                    ref={ref}
                    id={id}
                    className={`textarea-field resize-${resize} ${autoResize ? 'auto-resize' : ''}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    rows={autoResize ? 1 : rows}
                    maxLength={maxLength}
                    disabled={disabled}
                    required={required}
                    aria-invalid={!!error}
                    aria-describedby={
                        [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
                            .filter(Boolean)
                            .join(' ') || undefined
                    }
                />
            </div>

            <div className="textarea-footer">
                <span className="textarea-footer-left">
                    {error && (
                        <span id={`${id}-error`} className="textarea-error" role="alert">
                            {error}
                        </span>
                    )}
                    {!error && hint && (
                        <span id={`${id}-hint`} className="textarea-hint">
                            {hint}
                        </span>
                    )}
                </span>

                {maxLength && (
                    <span
                        className={`textarea-char-count ${isAtLimit ? 'at-limit' : isNearLimit ? 'near-limit' : ''}`}
                    >
                        {charCount}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
}

export default Textarea;
