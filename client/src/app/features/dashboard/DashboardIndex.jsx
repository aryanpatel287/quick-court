import { Navigate } from 'react-router';
import { useAuth } from '@/app/features/auth/hooks/useAuth';

export default function DashboardIndex() {
    const { user } = useAuth();
    const role = user?.role?.toLowerCase() || 'user';
    return <Navigate to={role === 'admin' ? 'admin' : 'user'} replace />;
}
