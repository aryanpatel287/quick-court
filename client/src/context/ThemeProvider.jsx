import { useEffect, useState, useMemo, useCallback } from 'react';
import { ThemeContext, THEME_STORAGE_KEY, VALID_THEMES } from './ThemeContext';

/**
 * Returns the current OS preferred color scheme ('light' | 'dark').
 */
const getSystemTheme = () => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
};

/**
 * Retrieves the stored theme preference from localStorage or initializes to 'system'.
 */
const getStoredTheme = () => {
    if (typeof window === 'undefined') return 'system';
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored && VALID_THEMES.includes(stored)) {
            return stored;
        }
        // Eagerly initialize default 'system' preference in localStorage
        localStorage.setItem(THEME_STORAGE_KEY, 'system');
        return 'system';
    } catch {
        return 'system';
    }
};

/**
 * Applies the resolved theme ('light' | 'dark') to documentElement attributes and colorScheme.
 */
const applyThemeToDOM = (resolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.style.colorScheme = resolvedTheme;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => getStoredTheme());

    const resolvedTheme = useMemo(() => {
        return theme === 'system' ? getSystemTheme() : theme;
    }, [theme]);

    // Apply theme changes to DOM and ensure localStorage is synchronized
    useEffect(() => {
        applyThemeToDOM(resolvedTheme);
    }, [resolvedTheme]);

    // Set theme handler with localStorage persistence
    const setTheme = useCallback((newTheme) => {
        if (!VALID_THEMES.includes(newTheme)) return;
        setThemeState(newTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (e) {
            console.error('Failed to save theme in localStorage:', e);
        }
    }, []);

    // 1. Cross-Tab Realtime Synchronization via storage events
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === THEME_STORAGE_KEY && e.newValue && VALID_THEMES.includes(e.newValue)) {
                setThemeState(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // 2. Real-time OS System Preference Listener (cross-browser / cross-OS)
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleMediaChange = (e) => {
            // Only update DOM and trigger re-render if user preference is currently 'system'
            const currentStoredTheme = getStoredTheme();
            if (currentStoredTheme === 'system') {
                const newSystemTheme = e.matches ? 'dark' : 'light';
                applyThemeToDOM(newSystemTheme);
                setThemeState('system');
            }
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleMediaChange);
        } else if (mediaQuery.addListener) {
            // Older Safari / WebKit browsers fallback
            mediaQuery.addListener(handleMediaChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleMediaChange);
            } else if (mediaQuery.removeListener) {
                mediaQuery.removeListener(handleMediaChange);
            }
        };
    }, []);

    const contextValue = useMemo(
        () => ({
            theme,
            resolvedTheme,
            setTheme,
        }),
        [theme, resolvedTheme, setTheme],
    );

    return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
