import Button from '@/components/Shared/Buttons/Button/Button';
import './InputGroup.scss';

export function InputGroup({ className = '', ...props }) {
    return <div className={`shared-input-group ${className}`} {...props} />;
}

export function InputGroupAddon({ className = '', align = 'inline-start', ...props }) {
    return <div className={`shared-input-group-addon align-${align} ${className}`} {...props} />;
}

export function InputGroupButton({
    className = '',
    type = 'button',
    variant = 'ghost',
    size = 'xs',
    ...props
}) {
    return (
        <Button
            type={type}
            variant={variant}
            className={`shared-input-group-button size-${size} ${className}`}
            {...props}
        />
    );
}

export function InputGroupTextarea({ className = '', ...props }) {
    return <textarea className={`shared-input-group-textarea ${className}`} {...props} />;
}
