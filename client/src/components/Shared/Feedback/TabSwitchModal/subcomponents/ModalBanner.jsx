import { Languages } from 'lucide-react';
import ToggleButton from '@/components/Shared/Buttons/ToggleButton/ToggleButton';
import './ModalBanner.scss';

/**
 * ModalBanner — Reusable feature callout banner box with title, description, and toggle switch.
 */
function ModalBanner({
    icon = <Languages size={20} />,
    title = 'Translation',
    subtitle = 'Automatically translate descriptions and reviews to English.',
    checked = false,
    onToggle,
    className = '',
}) {
    return (
        <div className={`modal-banner-callout ${className}`}>
            <div className="banner-content-left">
                <div className="banner-title-row">
                    <span className="banner-title">{title}</span>
                    {icon && <span className="banner-icon">{icon}</span>}
                </div>
                {subtitle && <p className="banner-subtitle">{subtitle}</p>}
            </div>

            <div className="banner-action-right">
                <ToggleButton checked={checked} onChange={onToggle} variant="primary" size="md" />
            </div>
        </div>
    );
}

export default ModalBanner;
