import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import App from './App';
import DashboardLayout from '@/app/features/dashboard/DashboardLayout/DashboardLayout';
import DashboardIndex from '@/app/features/dashboard/DashboardIndex';
import ProtectedRoute from '@/app/features/auth/components/ProtectedRoute';
import { loadFeatureRoutes } from './routes.loader';

// Auto-discover all *.routes.jsx across all feature modules
const { userRoutes, adminRoutes, publicRoutes } = loadFeatureRoutes();

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                index: true,
                element: <Navigate to="/login" replace />,
            },
            // Auto-discovered public feature routes (auth, showcase, etc.)
            ...publicRoutes,
            {
                path: 'dashboard',
                element: (
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                ),
                children: [
                    {
                        index: true,
                        element: <DashboardIndex />,
                    },
                    {
                        path: 'user',
                        children: [
                            {
                                index: true,
                                element: <Navigate to="analytics" replace />,
                            },
                            // Auto-discovered user feature routes
                            ...userRoutes,
                        ],
                    },
                    {
                        path: 'admin',
                        element: (
                            <ProtectedRoute allowedRoles={['admin']}>
                                <Outlet />
                            </ProtectedRoute>
                        ),
                        children: [
                            {
                                index: true,
                                element: <Navigate to="analytics" replace />,
                            },
                            // Auto-discovered admin feature routes
                            ...adminRoutes,
                        ],
                    },
                ],
            },
            {
                path: '*',
                element: <Navigate to="/login" replace />,
            },
        ],
    },
]);
