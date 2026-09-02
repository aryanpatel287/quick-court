import './Spinner.scss';

function Spinner({ label, size = 'md', fullScreen = false, className = '' }) {
    return (
        <div className={`shared-spinner-container ${fullScreen ? 'full-screen' : ''} ${className}`}>
            <div className={`shared-spinner size-${size}`} />
            {label && <span className="shared-spinner-label">{label}</span>}
        </div>
    );
}

export default Spinner;
