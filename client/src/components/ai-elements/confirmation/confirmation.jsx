'use client';

import { Alert, AlertDescription } from '@/components/Shared/Feedback/Alert/Alert';
import { default as Button } from '@/components/Shared/Buttons/Button/Button';
import { cn } from '@/lib/utils';
import { createContext, useContext, useMemo } from 'react';
import './confirmation.scss';

const ConfirmationContext = createContext(null);

const useConfirmation = () => {
    const context = useContext(ConfirmationContext);

    if (!context) {
        throw new Error('Confirmation components must be used within Confirmation');
    }

    return context;
};

export const Confirmation = ({ className, approval, state, ...props }) => {
    const contextValue = useMemo(() => ({ approval, state }), [approval, state]);

    if (!approval || state === 'input-streaming' || state === 'input-available') {
        return null;
    }

    return (
        <ConfirmationContext.Provider value={contextValue}>
            <Alert className={cn('ai-confirmation-container', className)} {...props} />
        </ConfirmationContext.Provider>
    );
};

export const ConfirmationTitle = ({ className, ...props }) => (
    <AlertDescription className={cn('ai-confirmation-title', className)} {...props} />
);

export const ConfirmationRequest = ({ children }) => {
    const { state } = useConfirmation();

    // Only show when approval is requested
    if (state !== 'approval-requested') {
        return null;
    }

    return children;
};

export const ConfirmationAccepted = ({ children }) => {
    const { approval, state } = useConfirmation();

    // Only show when approved and in response states
    if (
        !approval?.approved ||
        (state !== 'approval-responded' &&
            state !== 'output-denied' &&
            state !== 'output-available')
    ) {
        return null;
    }

    return children;
};

export const ConfirmationRejected = ({ children }) => {
    const { approval, state } = useConfirmation();

    // Only show when rejected and in response states
    if (
        approval?.approved !== false ||
        (state !== 'approval-responded' &&
            state !== 'output-denied' &&
            state !== 'output-available')
    ) {
        return null;
    }

    return children;
};

export const ConfirmationActions = ({ className, ...props }) => {
    const { state } = useConfirmation();

    // Only show when approval is requested
    if (state !== 'approval-requested') {
        return null;
    }

    return <div className={cn('ai-confirmation-actions', className)} {...props} />;
};

export const ConfirmationAction = (props) => (
    <Button className="ai-confirmation-action" type="button" {...props} />
);
