import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import HeroPanel from '@/components/Shared/HeroPanel/HeroPanel';
import RegisterForm from './RegisterForm/RegisterForm';
import { useAuth } from '@/app/features/auth/hooks/useAuth';
import Spinner from '@/components/Shared/Feedback/Spinner/Spinner';
import './RegisterLayout.scss';

function RegisterLayout() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

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
            <RegisterForm />
        </div>
    );
}

export default RegisterLayout;
