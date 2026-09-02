import { User } from 'lucide-react';
import Dropdown from '@/components/Shared/Form/Dropdown/Dropdown';
import RoleCard from './RoleCard/RoleCard';
import './RoleSelector.scss';

const ROLES = [
    {
        value: 'user',
        label: 'User',
        icon: User,
    },
];

function RoleSelector({ value, onChange, error, triggerRef, disabled, className = '' }) {
    return (
        <Dropdown
            label="Role"
            placeholder="Select Your Role"
            options={ROLES}
            value={value}
            onChange={onChange}
            error={error}
            triggerRef={triggerRef}
            disabled={disabled}
            className={className}
            renderOption={(option, isSelected) => (
                <RoleCard title={option.label} icon={option.icon} isSelected={isSelected} />
            )}
        />
    );
}

export default RoleSelector;
