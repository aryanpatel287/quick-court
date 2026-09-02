'use client';

import Badge from '@/components/Shared/DataDisplay/Badge/Badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/Shared/DataDisplay/Collapsible/Collapsible';
import { cn } from '@/lib/utils';
import {
    CheckCircleIcon,
    ChevronDownIcon,
    CircleIcon,
    ClockIcon,
    WrenchIcon,
    XCircleIcon,
} from 'lucide-react';
import { isValidElement } from 'react';

import { CodeBlock } from '../code-block/code-block';
import './tool.scss';

export const Tool = ({ className, ...props }) => (
    <Collapsible className={cn('ai-tool group', className)} {...props} />
);

const statusLabels = {
    'approval-requested': 'Awaiting Approval',
    'approval-responded': 'Responded',
    'input-available': 'Running',
    'input-streaming': 'Pending',
    'output-available': 'Completed',
    'output-denied': 'Denied',
    'output-error': 'Error',
};

const statusIcons = {
    'approval-requested': <ClockIcon className="ai-tool-badge-icon color-yellow" />,
    'approval-responded': <CheckCircleIcon className="ai-tool-badge-icon color-blue" />,
    'input-available': <ClockIcon className="ai-tool-badge-icon animate-pulse" />,
    'input-streaming': <CircleIcon className="ai-tool-badge-icon" />,
    'output-available': <CheckCircleIcon className="ai-tool-badge-icon color-green" />,
    'output-denied': <XCircleIcon className="ai-tool-badge-icon color-orange" />,
    'output-error': <XCircleIcon className="ai-tool-badge-icon color-red" />,
};

export const StatusBadge = ({ status }) => (
    <Badge className="ai-tool-badge" variant="secondary">
        {statusIcons[status]}
        {statusLabels[status]}
    </Badge>
);

export const ToolHeader = ({ className, title, type, state, toolName, ...props }) => {
    const derivedName = type === 'dynamic-tool' ? toolName : type.split('-').slice(1).join('-');

    return (
        <CollapsibleTrigger className={cn('ai-tool-header', className)} {...props}>
            <div className="ai-tool-header-left">
                <WrenchIcon className="ai-tool-header-icon" />
                <span className="ai-tool-header-title">{title ?? derivedName}</span>
                <StatusBadge status={state} />
            </div>
            <ChevronDownIcon className="ai-tool-header-chevron" />
        </CollapsibleTrigger>
    );
};

export const ToolContent = ({ className, ...props }) => (
    <CollapsibleContent className={cn('ai-tool-content', className)} {...props} />
);

export const ToolInput = ({ className, input, ...props }) => (
    <div className={cn('ai-tool-section', className)} {...props}>
        <h4 className="ai-tool-section-title">Parameters</h4>
        <div className="ai-tool-input-box">
            <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
        </div>
    </div>
);

export const ToolOutput = ({ className, output, errorText, ...props }) => {
    if (!(output || errorText)) {
        return null;
    }

    let Output = <div>{output}</div>;

    if (typeof output === 'object' && !isValidElement(output)) {
        Output = <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />;
    } else if (typeof output === 'string') {
        Output = <CodeBlock code={output} language="json" />;
    }

    return (
        <div className={cn('ai-tool-section', className)} {...props}>
            <h4 className="ai-tool-section-title">{errorText ? 'Error' : 'Result'}</h4>
            <div className={cn('ai-tool-output-box', errorText ? 'is-error' : 'is-success')}>
                {errorText && <div>{errorText}</div>}
                {Output}
            </div>
        </div>
    );
};
