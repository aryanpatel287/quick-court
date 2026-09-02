import { useState, useEffect } from 'react';

/**
 * Custom hook for managing animated cycling placeholder options.
 */
export function useAnimatedPlaceholder(placeholderOptions = [], placeholderInterval = 3500) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(null);

    const hasAnimatedOptions = Array.isArray(placeholderOptions) && placeholderOptions.length > 0;

    useEffect(() => {
        if (!hasAnimatedOptions || placeholderOptions.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                setPrevIndex(prev);
                return (prev + 1) % placeholderOptions.length;
            });
        }, placeholderInterval);
        return () => clearInterval(interval);
    }, [hasAnimatedOptions, placeholderOptions.length, placeholderInterval]);

    useEffect(() => {
        if (prevIndex === null) return;
        const timer = setTimeout(() => setPrevIndex(null), 400);
        return () => clearTimeout(timer);
    }, [currentIndex, prevIndex]);

    return {
        currentIndex,
        prevIndex,
        hasAnimatedOptions,
    };
}
