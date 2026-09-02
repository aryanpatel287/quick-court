import Button from '@/components/Shared/Buttons/Button/Button';
import './ServerErrorPage.scss';

function ServerErrorPage({
    title = 'Internal Server Error',
    message = 'Something went wrong on our servers. We have been notified and are looking into it.',
    onActionClick,
}) {
    return (
        <div className="error-page-container servererror-page">
            <div className="error-card">
                {/* Background Code */}
                <div className="error-code-bg">500</div>

                {/* Server Stack Icon */}
                <div className="error-graphic-wrapper">
                    <svg
                        className="error-svg-icon server-error"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                        <line x1="6" y1="6" x2="6.01" y2="6" />
                        <line x1="6" y1="18" x2="6.01" y2="18" />
                        <path d="M12 2v20" />
                        <circle cx="18" cy="6" r="1" />
                        <circle cx="18" cy="18" r="1" />
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

export default ServerErrorPage;
