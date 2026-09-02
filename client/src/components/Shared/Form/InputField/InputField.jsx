import { useState } from 'react';
import './InputField.scss';
import PasswordToggle from './PasswordToggle/PasswordToggle';

function InputField({
    label,
    id,
    type = 'text',
    placeholder,
    value,
    onChange,
    autoComplete,
    error,
    inputRef,
    disabled = false,
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);

    const isPassword = type === 'password';

    // Prevent browser autofill on load by using text type until focused or filled
    const inputType = isPassword
        ? showPassword
            ? 'text'
            : isFocused || value
              ? 'password'
              : 'text'
        : type;

    return (
        <div className={`form-group ${error ? 'has-error' : ''}`}>
            <label htmlFor={id} className="form-label">
                {label}
            </label>
            <div className="input-wrapper">
                <input
                    ref={inputRef}
                    type={inputType}
                    id={id}
                    className={`form-input ${isPassword ? 'password-input' : ''}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={(e) => {
                        setIsFocused(true);
                        if (isPassword && e.getModifierState) {
                            setIsCapsLockOn(e.getModifierState('CapsLock'));
                        }
                    }}
                    onBlur={() => {
                        setIsFocused(false);
                        setIsCapsLockOn(false);
                    }}
                    onKeyDown={(e) => {
                        if (isPassword && e.getModifierState) {
                            setIsCapsLockOn(e.getModifierState('CapsLock'));
                        }
                    }}
                    onKeyUp={(e) => {
                        if (isPassword && e.getModifierState) {
                            setIsCapsLockOn(e.getModifierState('CapsLock'));
                        }
                    }}
                    required
                    autoComplete={autoComplete}
                    disabled={disabled}
                />
                {isPassword && (
                    <PasswordToggle
                        showPassword={showPassword}
                        onClick={() => setShowPassword(!showPassword)}
                    />
                )}
            </div>
            {isCapsLockOn && <span className="caps-lock-warning">Caps Lock is on</span>}
            {error && <span className="error-message">{error}</span>}
        </div>
    );
}

export default InputField;
