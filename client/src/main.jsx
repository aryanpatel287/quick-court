import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './app/App.routes';
import './index.scss';
import { ToastProvider } from './components/Shared/Feedback/Toast';
import AuthProvider from './app/features/auth/context/auth.context';
import { ThemeProvider } from './context';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <RouterProvider router={router} />
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    </StrictMode>,
);
