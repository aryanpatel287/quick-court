import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

import {
    CodeBlock,
    CodeBlockHeader,
    CodeBlockFilename,
    CodeBlockActions,
    CodeBlockCopyButton,
} from '@/components/ai-elements/code-block/code-block';
import Mermaid from './Mermaid';
import MarkdownTable from './MarkdownTable';
import Kbd from './Kbd';
import Mark from './Mark';
import './MarkdownRenderer.scss';

const preprocessMarkdown = (text) => {
    if (!text) return '';

    // 1. Escape three or more consecutive dollar signs (e.g. $$$ -> \$\$\$)
    let processed = text.replace(/\${3,}/g, (match) => '\\$'.repeat(match.length));

    // 2. Escape/parse double-equals highlighting syntax (e.g. ==text== -> <mark>text</mark>)
    processed = processed.replace(/==([^=\n\r]+?)==/g, '<mark>$1</mark>');

    // 3. Find all patterns of $...$ on a single line and check if they are actually math or currency
    processed = processed.replace(/\$([^$\n]+)\$/g, (match, inner) => {
        const hasMathSymbols = /[\^_{}\\]/.test(inner);
        if (hasMathSymbols) {
            return match;
        }
        return `\\$${inner}\\$`;
    });

    return processed;
};

const MarkdownRenderer = React.memo(({ content }) => {
    const preprocessedContent = useMemo(() => {
        return preprocessMarkdown(content);
    }, [content]);

    const components = useMemo(
        () => ({
            pre({ children }) {
                return <>{children}</>;
            },

            code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeContent = String(children).replace(/\n$/, '');

                if (match) {
                    const language = match[1];
                    if (language === 'mermaid') {
                        return <Mermaid chart={codeContent} />;
                    }
                    return (
                        <CodeBlock language={language} code={codeContent}>
                            <CodeBlockHeader>
                                <CodeBlockFilename>{language}</CodeBlockFilename>
                                <CodeBlockActions>
                                    <CodeBlockCopyButton />
                                </CodeBlockActions>
                            </CodeBlockHeader>
                        </CodeBlock>
                    );
                }

                return (
                    <code className={className} {...props}>
                        {children}
                    </code>
                );
            },

            table({ children, ...props }) {
                return <MarkdownTable {...props}>{children}</MarkdownTable>;
            },

            kbd({ children, ...props }) {
                return <Kbd {...props}>{children}</Kbd>;
            },

            mark({ children, ...props }) {
                return <Mark {...props}>{children}</Mark>;
            },

            a({ href, children, className, ...props }) {
                const isFootnoteRef =
                    className?.includes('footnote-ref') || props['data-footnote-ref'] !== undefined;
                const isFootnoteBackref =
                    className?.includes('footnote-backref') ||
                    props['data-footnote-backref'] !== undefined;

                if (isFootnoteRef) {
                    return (
                        <a href={href} className="markdown-footnote-ref" {...props}>
                            {children}
                        </a>
                    );
                }

                if (isFootnoteBackref) {
                    return (
                        <a
                            href={href}
                            className="markdown-footnote-backref"
                            aria-label="Back to content"
                            {...props}
                        >
                            ↩
                        </a>
                    );
                }

                return (
                    <a href={href} className={className} {...props}>
                        {children}
                    </a>
                );
            },

            section({ children, className, ...props }) {
                const isFootnotes =
                    className === 'footnotes' || props['data-footnotes'] !== undefined;
                if (isFootnotes) {
                    return (
                        <section className="markdown-footnotes" {...props}>
                            <h4 className="markdown-footnotes__title">References</h4>
                            {children}
                        </section>
                    );
                }
                return (
                    <section className={className} {...props}>
                        {children}
                    </section>
                );
            },
        }),
        [],
    );

    const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
    const rehypePlugins = useMemo(() => [rehypeRaw, rehypeKatex], []);

    return (
        <div className="markdown-renderer">
            <ReactMarkdown
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
                components={components}
            >
                {preprocessedContent}
            </ReactMarkdown>
        </div>
    );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
