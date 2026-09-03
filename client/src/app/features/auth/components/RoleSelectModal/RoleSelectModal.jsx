import Dialog from '@/components/Shared/Feedback/Dialog/Dialog';
import { User, Building2, ChevronRight } from 'lucide-react';
import './RoleSelectModal.scss';

function RoleSelectModal({ isOpen, onClose, onSelectRole }) {
    const handleSelect = (roleKey) => {
        onSelectRole(roleKey);
        onClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Create an Account"
            size="md"
            cancelText=""
            confirmText=""
            showCloseIcon={true}
        >
            <div className="role-select-modal-content">
                <p className="role-select-subtitle">
                    Select how you would like to use QuickCourt to get started:
                </p>

                <div className="role-cards-grid">
                    {/* User / Player Card */}
                    <button
                        type="button"
                        className="role-card-item"
                        onClick={() => handleSelect('user')}
                        aria-label="Register as a Player or Court Booker"
                    >
                        <div className="role-card-icon-box user-icon-box">
                            <User size={28} className="role-card-icon" />
                        </div>
                        <div className="role-card-info">
                            <div className="role-card-header">
                                <h4 className="role-card-title">Player / User</h4>
                                <span className="role-card-badge">Instant Access</span>
                            </div>
                            <p className="role-card-desc">
                                Discover and book indoor & outdoor courts, schedule matches, and
                                track your games.
                            </p>
                        </div>
                        <div className="role-card-action">
                            <span className="action-label">Continue</span>
                            <ChevronRight size={18} className="action-arrow" />
                        </div>
                    </button>

                    {/* Facility Owner Card */}
                    <button
                        type="button"
                        className="role-card-item"
                        onClick={() => handleSelect('facility-owner')}
                        aria-label="Register as a Facility Owner"
                    >
                        <div className="role-card-icon-box owner-icon-box">
                            <Building2 size={28} className="role-card-icon" />
                        </div>
                        <div className="role-card-info">
                            <div className="role-card-header">
                                <h4 className="role-card-title">Facility Owner</h4>
                                <span className="role-card-badge partner-badge">Partner</span>
                            </div>
                            <p className="role-card-desc">
                                List sports venues, manage court slots, accept instant bookings, and
                                boost your revenue.
                            </p>
                        </div>
                        <div className="role-card-action">
                            <span className="action-label">Continue</span>
                            <ChevronRight size={18} className="action-arrow" />
                        </div>
                    </button>
                </div>
            </div>
        </Dialog>
    );
}

export default RoleSelectModal;
