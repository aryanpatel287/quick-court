'use client';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/Shared/DataDisplay/Collapsible/Collapsible';
import { cn } from '@/lib/utils';
import { BookIcon, ChevronDownIcon } from 'lucide-react';
import './sources.scss';

export const Sources = ({ className, ...props }) => (
    <Collapsible className={cn('ai-sources', className)} {...props} />
);

export const SourcesTrigger = ({ className, count, children, ...props }) => (
    <CollapsibleTrigger className={cn('ai-sources-trigger', className)} {...props}>
        {children ?? (
            <>
                <p className="ai-sources-trigger-title">Used {count} sources</p>
                <ChevronDownIcon className="ai-sources-icon" />
            </>
        )}
    </CollapsibleTrigger>
);

export const SourcesContent = ({ className, ...props }) => (
    <CollapsibleContent className={cn('ai-sources-content', className)} {...props} />
);

export const Source = ({ href, title, children, ...props }) => (
    <a className="ai-source-item" href={href} rel="noreferrer" target="_blank" {...props}>
        {children ?? (
            <>
                <BookIcon className="ai-sources-icon" />
                <span className="ai-source-title">{title}</span>
            </>
        )}
    </a>
);
