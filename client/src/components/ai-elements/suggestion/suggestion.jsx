'use client';

import Button from '@/components/Shared/Buttons/Button/Button';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';
import './suggestion.scss';

export const Suggestions = ({ className, children, ...props }) => (
    <div className={cn('ai-suggestions-container', className)} {...props}>
        <div className="ai-suggestions-track">{children}</div>
    </div>
);

export const Suggestion = ({
    suggestion,
    onClick,
    className,
    variant = 'outline',
    size = 'sm',
    children,
    ...props
}) => {
    const handleClick = useCallback(() => {
        onClick?.(suggestion);
    }, [onClick, suggestion]);

    return (
        <Button
            className={cn('ai-suggestion', className)}
            onClick={handleClick}
            size={size}
            type="button"
            variant={variant}
            {...props}
        >
            {children || suggestion}
        </Button>
    );
};
