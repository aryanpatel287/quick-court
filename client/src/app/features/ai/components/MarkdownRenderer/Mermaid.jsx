import React, { useLayoutEffect, useRef } from 'react';
import mermaid from 'mermaid';

const getThemeColor = (cssVarName, fallback) => {
    if (typeof window === 'undefined') return fallback;
    let value = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();

    // Resolve nested CSS variable strings (e.g. var(--primi-gray-100))
    if (value.startsWith('var(')) {
        const nestedVar = value.slice(4, -1).trim();
        value = getComputedStyle(document.documentElement).getPropertyValue(nestedVar).trim();
    }

    return value || fallback;
};

const Mermaid = React.memo(({ chart }) => {
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        let isMounted = true;
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

        const renderDiagram = async () => {
            if (!chart) return;

            // Resolve values dynamically from styling tokens
            const gray100 = getThemeColor('--color-gray-100', '#f3f4f6');
            const gray900 = getThemeColor('--color-gray-900', '#111827');
            const blueDark = getThemeColor('--color-blue-dark', '#2f54eb');

            mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose',
                fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif',
                themeVariables: {
                    fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif',
                    background: 'transparent',
                    primaryColor: gray100,
                    primaryTextColor: gray900,
                    textColor: gray900,
                    lineColor: blueDark,
                },
            });

            try {
                const { svg } = await mermaid.render(id, chart);
                if (isMounted && containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
            } catch (err) {
                console.error('Mermaid render error:', err);
                const element = document.getElementById(id);
                if (element) {
                    element.remove();
                }

                if (isMounted && containerRef.current) {
                    containerRef.current.innerHTML = `<pre class="mermaid-container__fallback"><code>${chart}</code></pre>`;
                }
            }
        };

        renderDiagram();

        return () => {
            isMounted = false;
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        };
    }, [chart]);

    return <div className="mermaid-container" ref={containerRef} />;
});

Mermaid.displayName = 'Mermaid';

export default Mermaid;
