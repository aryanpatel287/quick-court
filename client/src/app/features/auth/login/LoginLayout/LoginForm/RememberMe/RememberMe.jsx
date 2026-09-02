import { useState } from 'react';
import Checkbox from '@/components/Shared/Form/Checkbox/Checkbox';
import { Info as InfoIcon } from 'lucide-react';
import './RememberMe.scss';

function RememberMe({ checked, onChange, onForgotPassword }) {
    const [showPopover, setShowPopover] = useState(false);

    return (
        <div className="utilities-row">
            <div className="remember-block">
                <div className="remember-checkbox-wrapper">
                    <Checkbox
                        id="remember-me-checkbox"
                        checked={checked}
                        onChange={onChange}
                        label="Keep me logged in"
                    />
                    <div
                        className="remember-info-wrapper"
                        onMouseEnter={() => setShowPopover(true)}
                        onMouseLeave={() => setShowPopover(false)}
                        onFocus={() => setShowPopover(true)}
                        onBlur={() => setShowPopover(false)}
                    >
                        <span
                            className="remember-info-icon"
                            aria-label="Keep me logged in information"
                            tabIndex={0}
                            role="img"
                        >
                            <InfoIcon size={14} />
                        </span>

                        {showPopover && (
                            <div className="remember-info-popover" role="tooltip">
                                <div className="popover-header">
                                    <span>Session Info</span>
                                </div>
                                <div className="popover-body">
                                    Session Duration: <strong>15 days</strong>. Storing this secure
                                    session token keeps you logged in on this device.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="remember-help">Use this for devices you trust</div>
            </div>
            <a
                href="#"
                className="forgot-link"
                onClick={(e) => {
                    e.preventDefault();
                    if (onForgotPassword) onForgotPassword();
                }}
            >
                Forgot Password?
            </a>
        </div>
    );
}

export default RememberMe;
