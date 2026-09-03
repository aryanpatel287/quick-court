import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import HeroPanel from '@/components/Shared/HeroPanel/HeroPanel';
import RegisterForm from './RegisterForm/RegisterForm';
import { useAuth } from '@/app/features/auth/hooks/useAuth';
import Spinner from '@/components/Shared/Feedback/Spinner/Spinner';
import './RegisterLayout.scss';

function RegisterLayout({ role: propRole }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading } = useAuth();

    // Determine role from prop or route pathname
    const activeRole =
        propRole || (location.pathname.includes('facility-owner') ? 'FACILITY_OWNER' : 'USER');

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading || user) {
        return <Spinner label="Loading..." fullScreen />;
    }

    return (
        <div className="main-layout">
            <HeroPanel />
            <RegisterForm role={activeRole} />
        </div>
    );
}

export default RegisterLayout;
