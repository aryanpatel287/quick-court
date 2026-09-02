import React from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/Shared/Buttons/Button/Button';
import './EmptyState.scss';

/**
 * Universal EmptyState Component
 * Single clean source of truth for empty state visuals across the workspace.
 *
 * Props:
 *  - title            {string|node}    Primary empty title heading
 *  - description      {string|node}    Secondary explanatory subtitle text (or subtitle)
 *  - subtitle         {string|node}    Alias for description
 *  - icon             {Component|node} Lucide icon component or custom React element
 *  - action           {node|object}    Action slot or action config { label, onClick, icon, variant }
 *  - actionLabel      {string}         Convenience prop for action button label
 *  - onActionClick    {function}       Convenience prop for action button click handler
 *  - actionIcon       {Component|node} Custom icon for the action button (defaults to Plus)
 *  - variant          {string}         'inline' | 'card' | 'compact' | 'minimal' | 'table' (default: 'inline')
 *  - size             {string}         'sm' | 'md' | 'lg' (default: 'md')
 *  - colSpan          {number}         Column span when variant is 'table' (default: 1)
 *  - className        {string}         Extra CSS classes
 *  - style            {object}         Inline styles
 *  - children         {node}           Additional content slot
 */
function EmptyState({
    title = null,
    description = null,
    subtitle = null,
    icon: IconComponent = null,
    action = null,
    actionLabel = null,
    onActionClick = null,
    actionIcon: ActionIcon = Plus,
    variant = 'inline',
    size = 'md',
    colSpan = 1,
    className = '',
    style = {},
    children = null,
}) {
    const displayDescription = description || subtitle;

    const renderAction = () => {
        if (action) {
            if (React.isValidElement(action)) return action;
            if (typeof action === 'object' && action.label) {
                const {
                    label,
                    onClick,
                    icon: CustomIcon,
                    variant: btnVariant = 'primary',
                } = action;
                const IconToRender = CustomIcon || Plus;
                return (
                    <Button variant={btnVariant} onClick={onClick} className="empty-action-btn">
                        {IconToRender && (
                            <IconToRender
                                size={20}
                                strokeWidth={2.2}
                                style={{ marginRight: '6px' }}
                            />
                        )}
                        {label}
                    </Button>
                );
            }
        }

        if (actionLabel && onActionClick) {
            return (
                <Button variant="primary" onClick={onActionClick} className="empty-action-btn">
                    {ActionIcon && (
                        <ActionIcon size={20} strokeWidth={2.2} style={{ marginRight: '6px' }} />
                    )}
                    {actionLabel}
                </Button>
            );
        }

        return null;
    };

    const renderIcon = () => {
        if (!IconComponent) return null;

        if (React.isValidElement(IconComponent)) {
            return <div className="empty-icon-wrapper">{IconComponent}</div>;
        }

        if (typeof IconComponent === 'function' || typeof IconComponent === 'object') {
            const iconSize = size === 'sm' ? 20 : size === 'lg' ? 36 : 28;
            return (
                <div className="empty-icon-wrapper">
                    <IconComponent size={iconSize} className="empty-icon" strokeWidth={1.8} />
                </div>
            );
        }

        return null;
    };

    const content = (
        <div
            className={`universal-empty-state variant-${variant} size-${size} ${className}`}
            style={style}
        >
            {renderIcon()}
            {title && <h4 className="empty-title">{title}</h4>}
            {displayDescription && <p className="empty-description">{displayDescription}</p>}
            {children}
            {renderAction() && <div className="empty-state-action-wrapper">{renderAction()}</div>}
        </div>
    );

    if (variant === 'table') {
        return (
            <tr>
                <td colSpan={colSpan} className="universal-empty-state-table-cell">
                    {content}
                </td>
            </tr>
        );
    }

    return content;
}

export default EmptyState;
