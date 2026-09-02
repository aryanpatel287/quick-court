import Button from '@/components/Shared/Buttons/Button/Button';
import './NotFoundPage.scss';

function NotFoundPage({
    title = 'Page Not Found',
    message = 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
    onActionClick,
}) {
    return (
        <div className="error-page-container notfound-page">
            <div className="error-card">
                {/* Background Code */}
                <div className="error-code-bg">404</div>

                {/* Not Found Icon */}
                <div className="error-graphic-wrapper">
                    <svg
                        className="error-svg-icon not-found"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6" />
                        <path d="m9 9 6 6" />
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

export default NotFoundPage;
