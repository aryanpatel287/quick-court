import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import Spinner from '@/components/Shared/Feedback/Spinner/Spinner';
import ForbiddenPage from '@/components/Shared/ErrorPages/ForbiddenPage/ForbiddenPage';

/**
 * ProtectedRoute Component with Multi-Role Access Control
 *
 * @param {React.ReactNode} children - Component to render when authorized
 * @param {string[]} [allowedRoles] - Optional list of authorized roles (case-insensitive)
 * @param {string} [fallbackPath] - Optional redirect route if unauthorized
 */
const ProtectedRoute = ({ children, allowedRoles, fallbackPath }) => {
    const { user, loading, error } = useAuth();
    const navigate = useNavigate();

    // 1. Loading state while checking active session
    if (loading && !error && !user) {
        return <Spinner label="Checking authentication..." fullScreen />;
    }

    // 2. Unauthenticated user -> redirect to login
    if (!user && !loading) {
        return <Navigate to="/login" replace />;
    }

    // 3. Multi-Role RBAC check (case-insensitive)
    if (allowedRoles && user) {
        const userRole = user.role?.toLowerCase() || '';
        const hasRoleAccess = allowedRoles.some((role) => role.toLowerCase() === userRole);

        if (!hasRoleAccess) {
            if (fallbackPath) {
                return <Navigate to={fallbackPath} replace />;
            }
            return (
                <ForbiddenPage
                    title="Access Forbidden"
                    message={`Your current role (${user.role || 'User'}) does not have permission to view this section.`}
                    onActionClick={() => navigate('/dashboard')}
                />
            );
        }
    }

    return children;
};

export default ProtectedRoute;
