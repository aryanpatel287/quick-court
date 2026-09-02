import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import HeroPanel from '@/components/Shared/HeroPanel/HeroPanel';
import LoginForm from './LoginForm/LoginForm';
import ForgotPasswordForm from './ForgotPasswordForm/ForgotPasswordForm';
import RecoverAccountForm from './RecoverAccountForm/RecoverAccountForm';
import { useAuth } from '@/app/features/auth/hooks/useAuth';
import Spinner from '@/components/Shared/Feedback/Spinner/Spinner';
import './LoginLayout.scss';

function LoginLayout() {
    const location = useLocation();
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

    // Determine current view state ('login' | 'forgot' | 'recover') using react-router location path
    let view = 'login';
    if (location.pathname === '/reset-password') {
        view = 'forgot';
    } else if (location.pathname === '/recover-account') {
        view = 'recover';
    }

    return (
        <div className="main-layout">
            <HeroPanel />
            {view === 'login' ? (
                <LoginForm />
            ) : view === 'forgot' ? (
                <ForgotPasswordForm onNavigateToLogin={() => navigate('/login')} />
            ) : (
                <RecoverAccountForm onNavigateToLogin={() => navigate('/login')} />
            )}
        </div>
    );
}

export default LoginLayout;
