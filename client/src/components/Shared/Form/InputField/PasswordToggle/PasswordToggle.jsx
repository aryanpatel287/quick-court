import './PasswordToggle.scss';

function PasswordToggle({ showPassword, onClick }) {
    return (
        <button
            type="button"
            className={`password-toggle ${showPassword ? 'is-visible' : ''}`}
            onClick={onClick}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
            <div className="icon-wrapper">
                {/* Closed Padlock SVG (Password Hidden) */}
                <svg
                    className="lock-icon icon-closed"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>

                {/* Open Padlock SVG (Password Visible) */}
                <svg
                    className="lock-icon icon-open"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
            </div>
        </button>
    );
}

export default PasswordToggle;
