import ProtectedRoute from '@/app/features/auth/components/ProtectedRoute';

/**
 * Dynamic Feature Route Loader for Apex Template
 *
 * Automatically scans all `*.routes.jsx` files in `src/app/features/`
 * using Vite's `import.meta.glob` and aggregates them by target layout:
 *
 * - `userRoutes`: Injected into `/dashboard/user/`
 * - `adminRoutes`: Injected into `/dashboard/admin/`
 * - `publicRoutes`: Injected at root level `/`
 * - `featureNavItems`: Aggregated sidebar navigation item metadata
 *
 * Supported feature export formats:
 * 1. Unified Multi-Role RBAC Format (Recommended):
 *    export default {
 *        allowedRoles: ['admin', 'manager', 'sales_rep'],
 *        navItem: { label: 'Leads', path: '/dashboard/user/leads', icon: 'Users', roles: [...] },
 *        routes: [ { path: 'leads', element: <LeadsPage /> } ]
 *    }
 *
 * 2. Explicit named route arrays:
 *    export default { userRoutes: [...], adminRoutes: [...], publicRoutes: [...] }
 *
 * 3. Target-based format:
 *    export default { target: 'user' | 'admin' | 'both' | 'public', routes: [...] }
 */

export function loadFeatureRoutes() {
    const routeModules = import.meta.glob('./features/**/*.routes.jsx', { eager: true });

    const userRoutes = [];
    const adminRoutes = [];
    const publicRoutes = [];
    const featureNavItems = [];

    const processRouteConfig = (config) => {
        if (!config) return;

        // Collect navItem metadata if present
        if (config.navItem) {
            featureNavItems.push(config.navItem);
        }

        // Format 1: Explicit target arrays (userRoutes, adminRoutes, publicRoutes)
        if (config.userRoutes) {
            userRoutes.push(
                ...(Array.isArray(config.userRoutes) ? config.userRoutes : [config.userRoutes]),
            );
        }
        if (config.adminRoutes) {
            adminRoutes.push(
                ...(Array.isArray(config.adminRoutes) ? config.adminRoutes : [config.adminRoutes]),
            );
        }
        if (config.publicRoutes) {
            publicRoutes.push(
                ...(Array.isArray(config.publicRoutes)
                    ? config.publicRoutes
                    : [config.publicRoutes]),
            );
        }

        // Format 2: Unified Multi-Role RBAC (allowedRoles & routes)
        if (config.allowedRoles && config.routes) {
            const rawRoutes = Array.isArray(config.routes) ? config.routes : [config.routes];
            const protectedRoutes = rawRoutes.map((route) => ({
                ...route,
                element: (
                    <ProtectedRoute allowedRoles={config.allowedRoles}>
                        {route.element}
                    </ProtectedRoute>
                ),
            }));

            userRoutes.push(...protectedRoutes);
            adminRoutes.push(...protectedRoutes);
        }

        // Format 3: target & routes specification
        if (config.target && config.routes) {
            const routesList = Array.isArray(config.routes) ? config.routes : [config.routes];

            if (config.target === 'user') {
                userRoutes.push(...routesList);
            } else if (config.target === 'admin') {
                adminRoutes.push(...routesList);
            } else if (config.target === 'both' || config.target === 'all') {
                userRoutes.push(...routesList);
                adminRoutes.push(...routesList);
            } else if (config.target === 'public') {
                publicRoutes.push(...routesList);
            }
        }
    };

    Object.values(routeModules).forEach((module) => {
        const config = module.default || module;

        if (Array.isArray(config)) {
            config.forEach(processRouteConfig);
        } else {
            processRouteConfig(config);
        }
    });

    return {
        userRoutes,
        adminRoutes,
        publicRoutes,
        featureNavItems,
    };
}
