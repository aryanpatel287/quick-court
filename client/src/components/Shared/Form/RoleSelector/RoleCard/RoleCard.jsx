import './RoleCard.scss';

function RoleCard({ title, icon: Icon, isSelected }) {
    return (
        <div className="role-card-inner">
            <div className="role-card-left">
                {Icon && <Icon className="role-card-icon" />}
                <span className="role-card-title">{title}</span>
            </div>
            {isSelected && (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="role-card-check"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )}
        </div>
    );
}

export default RoleCard;
