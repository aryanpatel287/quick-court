import { useRef, useEffect } from 'react';
import './OtpInput.scss';

function OtpInput({ value, onChange, error, disabled }) {
    const inputRefs = useRef([]);

    useEffect(() => {
        // Auto-focus the first input on mount
        if (inputRefs.current[0] && !disabled) {
            inputRefs.current[0].focus();
        }
    }, [disabled]);

    const handleChange = (e, index) => {
        if (disabled) return;
        const val = e.target.value;
        // Allow only alphanumeric characters
        if (val && !/^[a-zA-Z0-9]$/.test(val)) return;

        const newOtp = [...value];
        newOtp[index] = val;
        onChange(newOtp);

        // Auto-focus next input if a digit is entered
        if (val && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (disabled) return;
        // Backspace: clear current value or go to previous input
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0 && inputRefs.current[index - 1]) {
                const newOtp = [...value];
                newOtp[index - 1] = '';
                onChange(newOtp);
                inputRefs.current[index - 1].focus();
            } else {
                const newOtp = [...value];
                newOtp[index] = '';
                onChange(newOtp);
            }
        }
    };

    const handlePaste = (e) => {
        if (disabled) return;
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        // Check if pasted content is a 6-character alphanumeric string
        if (/^[a-zA-Z0-9]{6}$/.test(pastedData)) {
            const newOtp = pastedData.split('');
            onChange(newOtp);
            // Focus the last input
            if (inputRefs.current[5]) {
                inputRefs.current[5].focus();
            }
        }
    };

    return (
        <div
            className={`otp-input-container ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}
        >
            <div className="otp-inputs-row">
                {value.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={handlePaste}
                        className="otp-digit-field"
                        inputMode="text"
                        pattern="[a-zA-Z0-9]*"
                        aria-label={`OTP Digit ${index + 1}`}
                        disabled={disabled}
                    />
                ))}
            </div>
            {error && <span className="error-message">{error}</span>}
        </div>
    );
}

export default OtpInput;
