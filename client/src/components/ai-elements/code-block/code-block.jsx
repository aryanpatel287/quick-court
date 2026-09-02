'use client';

import Button from '@/components/Shared/Buttons/Button/Button';
import { cn } from '@/lib/utils';
import { CheckIcon, CopyIcon } from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import './code-block.scss';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

// Context
const CodeBlockContext = createContext({
    code: '',
});

export const CodeBlockContainer = ({ className, language, style, ...props }) => (
    <div
        className={cn('ai-code-container', className)}
        data-language={language}
        style={{
            containIntrinsicSize: 'auto 200px',
            contentVisibility: 'auto',
            ...style,
        }}
        {...props}
    />
);

export const CodeBlockHeader = ({ children, className, ...props }) => (
    <div className={cn('ai-code-header', className)} {...props}>
        {children}
    </div>
);

export const CodeBlockTitle = ({ children, className, ...props }) => (
    <div className={cn('ai-code-title', className)} {...props}>
        {children}
    </div>
);

export const CodeBlockFilename = ({ children, className, ...props }) => (
    <span className={cn('ai-code-filename', className)} {...props}>
        {children}
    </span>
);

export const CodeBlockActions = ({ children, className, ...props }) => (
    <div className={cn('ai-code-actions', className)} {...props}>
        {children}
    </div>
);

const renderPrismTokens = (tokens, keyPrefix = 'prism') => {
    if (typeof tokens === 'string') {
        return tokens;
    }
    if (Array.isArray(tokens)) {
        return tokens.map((token, i) => renderPrismTokens(token, `${keyPrefix}-${i}`));
    }
    const { type, content } = tokens;
    return (
        <span key={keyPrefix} className={cn('token', type)}>
            {renderPrismTokens(content, `${keyPrefix}-${type}`)}
        </span>
    );
};

export const CodeBlockContent = ({ code, language, showLineNumbers = false }) => {
    const highlightedTokens = useMemo(() => {
        if (!code) return '';
        const lang = language ? language.toLowerCase() : 'text';
        const prismLang = Prism.languages[lang];
        if (!prismLang) {
            return code;
        }
        return Prism.tokenize(code, prismLang);
    }, [code, language]);

    const content = useMemo(() => {
        if (typeof highlightedTokens === 'string') {
            return highlightedTokens;
        }
        return renderPrismTokens(highlightedTokens);
    }, [highlightedTokens]);

    return (
        <div className="ai-code-content-wrapper">
            <pre className="ai-code-pre">
                <code className={cn('ai-code-code', showLineNumbers && 'show-line-numbers')}>
                    {content}
                </code>
            </pre>
        </div>
    );
};

export const CodeBlock = ({
    code,
    language,
    showLineNumbers = false,
    className,
    children,
    ...props
}) => {
    const contextValue = useMemo(() => ({ code }), [code]);

    return (
        <CodeBlockContext.Provider value={contextValue}>
            <CodeBlockContainer className={className} language={language} {...props}>
                {children}
                <CodeBlockContent
                    code={code}
                    language={language}
                    showLineNumbers={showLineNumbers}
                />
            </CodeBlockContainer>
        </CodeBlockContext.Provider>
    );
};

export const CodeBlockCopyButton = ({
    onCopy,
    onError,
    timeout = 2000,
    children,
    className,
    ...props
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const timeoutRef = useRef(0);
    const { code } = useContext(CodeBlockContext);

    const copyToClipboard = useCallback(async () => {
        if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
            onError?.(new Error('Clipboard API not available'));
            return;
        }

        try {
            if (!isCopied) {
                await navigator.clipboard.writeText(code);
                setIsCopied(true);
                onCopy?.();
                timeoutRef.current = window.setTimeout(() => setIsCopied(false), timeout);
            }
        } catch (error) {
            onError?.(error);
        }
    }, [code, onCopy, onError, timeout, isCopied]);

    useEffect(
        () => () => {
            window.clearTimeout(timeoutRef.current);
        },
        [],
    );

    const Icon = isCopied ? CheckIcon : CopyIcon;

    return (
        <Button
            className={cn('ai-code-copy-btn', className)}
            onClick={copyToClipboard}
            size="icon"
            variant="secondary"
            {...props}
        >
            {children ?? <Icon size={14} />}
        </Button>
    );
};

const SelectContext = createContext(null);

export const CodeBlockLanguageSelector = ({ value, onValueChange, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const contextValue = useMemo(
        () => ({
            value,
            onValueChange,
            isOpen,
            setIsOpen,
        }),
        [value, onValueChange, isOpen],
    );

    return (
        <SelectContext.Provider value={contextValue}>
            <div ref={dropdownRef} className="ai-code-lang-selector">
                {children}
            </div>
        </SelectContext.Provider>
    );
};

export const CodeBlockLanguageSelectorTrigger = ({ className, children, ...props }) => {
    const { isOpen, setIsOpen } = useContext(SelectContext);
    return (
        <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn('ai-code-lang-trigger', className)}
            {...props}
        >
            {children}
        </button>
    );
};

export const CodeBlockLanguageSelectorValue = ({ placeholder }) => {
    const { value } = useContext(SelectContext);
    return <span>{value || placeholder}</span>;
};

export const CodeBlockLanguageSelectorContent = ({ className, children, ...props }) => {
    const { isOpen } = useContext(SelectContext);
    if (!isOpen) return null;
    return (
        <div className={cn('ai-code-lang-content', className)} {...props}>
            {children}
        </div>
    );
};

export const CodeBlockLanguageSelectorItem = ({ value, children, ...props }) => {
    const { onValueChange, setIsOpen, value: selectedValue } = useContext(SelectContext);
    const isSelected = selectedValue === value;
    return (
        <button
            type="button"
            onClick={() => {
                onValueChange?.(value);
                setIsOpen(false);
            }}
            className={cn('ai-code-lang-item', isSelected && 'is-selected')}
            {...props}
        >
            {children}
        </button>
    );
};
