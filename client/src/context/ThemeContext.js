import { createContext } from 'react';

export const ThemeContext = createContext(null);
export const THEME_STORAGE_KEY = 'app-theme';
export const VALID_THEMES = ['light', 'dark', 'system'];

export { useTheme } from '@/hooks/useTheme';
export { ThemeProvider } from './ThemeProvider';
