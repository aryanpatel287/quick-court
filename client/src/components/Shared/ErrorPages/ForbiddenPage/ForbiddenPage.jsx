import Button from '@/components/Shared/Buttons/Button/Button';
import './ForbiddenPage.scss';

function ForbiddenPage({
    title = 'Access Forbidden',
    message = "You don't have permission to access this resource. Please contact your workspace administrator.",
    onActionClick,
}) {
    return (
        <div className="error-page-container forbidden-page">
            <div className="error-card">
                {/* Background Code */}
                <div className="error-code-bg">403</div>

                {/* Locked Padlock Icon */}
                <div className="error-graphic-wrapper">
                    <svg
                        className="error-svg-icon forbidden"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        <circle cx="12" cy="16" r="1.5" />
                    </svg>
                </div>

                {/* Text Copy */}
                <div className="error-content">
                    <h2 className="error-title">{title}</h2>
                    <p className="error-message">{message}</p>
                </div>

                {/* CTA */}
                <div className="error-action-row">
                    <Button
                        variant="solid"
                        onClick={onActionClick || (() => alert('Navigate safety action triggered'))}
                        className="error-home-btn"
                    >
                        Return to Safety
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ForbiddenPage;
