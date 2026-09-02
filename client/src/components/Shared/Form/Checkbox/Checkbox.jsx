import { useId } from 'react';
import { Check as CheckIcon } from 'lucide-react';
import './Checkbox.scss';

function Checkbox({ checked = false, onChange, id, label = '', className = '' }) {
    const defaultId = useId();
    const checkboxId = id || defaultId;

    return (
        <label htmlFor={checkboxId} className={`checkbox-custom-container ${className}`}>
            <input
                type="checkbox"
                id={checkboxId}
                checked={checked}
                onChange={onChange}
                className="checkbox-hidden-input"
            />
            <span className="checkbox-checkmark-box">
                {checked && <CheckIcon size={10} strokeWidth={4} className="checkbox-check-svg" />}
            </span>
            {label && <span className="checkbox-label-text">{label}</span>}
        </label>
    );
}

export default Checkbox;
