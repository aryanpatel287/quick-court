import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

import FormHeader from '@/components/Shared/DataDisplay/FormHeader/FormHeader';
import InputField from '@/components/Shared/Form/InputField/InputField';
import RememberMe from './RememberMe/RememberMe';
import Button from '@/components/Shared/Buttons/Button/Button';
import SignupPrompt from './SignupPrompt/SignupPrompt';
import { useToast } from '@/components/Shared/Feedback/Toast';
import { ShieldAlert } from 'lucide-react';
import { validateEmail, validatePassword } from '@/utils/validation';
import Dialog from '@/components/Shared/Feedback/Dialog';
import { useAuth } from '../../../hooks/useAuth';
import './LoginForm.scss';

/**
 * ======================================================================================
 * SERVER-SIDE INTEGRATION GUIDE (Account Lockout Security Architecture):
 * ======================================================================================
 * In a production application, Account Lockout MUST be enforced on the SERVER SIDE.
 *
 * SERVER-SIDE RESPONSIBILITIES:
 * 1. DB/Redis Attempt Tracking: Maintain a counter (e.g., `failed_login_attempts`) per user email & IP.
 * 2. Lockout Trigger: When failed attempts reach threshold (e.g. 5), set `locked_until = NOW() + 15 MINS`.
 * 3. Rejection & Status Codes: Any incoming request for a locked user must be rejected at API layer:
 *    HTTP Status: 429 (Too Many Requests) or 401 (Unauthorized)
 *    Response Payload: {
 *      code: 'ACCOUNT_LOCKED',
 *      message: 'Account temporarily locked due to multiple failed login attempts.',
 *      retryAfterSeconds: 300
 *    }
 * 4. Automatic Reset: Reset failed_attempts = 0 upon a valid password authentication.
 *
 * CLIENT-SIDE RESPONSIBILITIES (Implemented below):
 * 1. Lockout Countdown Timer: Render an interactive live timer ("Account locked. Try again in 04:59").
 * 2. Form & Button Disabling: Disable input fields & submit button during lockout to stop spamming.
 * 3. Clear Error Messaging: Display a prominent error banner when account is locked.
 * ======================================================================================
 */

const formatDateToDDMMYYYY = (dateStringOrDate) => {
    if (!dateStringOrDate) return '';
    const date = new Date(dateStringOrDate);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const FAILED_LOGIN_EMAIL_KEY = 'failedLoginEmail';

function LoginForm() {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const { handleLogin } = useAuth();

    const [email, setEmail] = useState(() => sessionStorage.getItem(FAILED_LOGIN_EMAIL_KEY) || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Client-Side Lockout State Management
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
    const timerRef = useRef(null);

    // Account Recovery Modal States
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    const [recoverableEmail, setRecoverableEmail] = useState('');
    const [daysRemaining, setDaysRemaining] = useState(15);
    const [recoveryExpiresAt, setRecoveryExpiresAt] = useState('');

    // Interactive Countdown Timer Effect
    useEffect(() => {
        if (isLockedOut && lockoutTimeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setLockoutTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setIsLockedOut(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isLockedOut, lockoutTimeRemaining]);

    // Helper to format remaining seconds into MM:SS
    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // If client is currently locked out, prevent form submission
        if (isLockedOut) return;

        let hasError = false;

        setEmailError('');
        setPasswordError('');

        let firstInvalidField = null;

        // Trim inputs
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        // Email check
        const emailValidation = validateEmail(trimmedEmail);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.message);
            hasError = true;
            firstInvalidField = firstInvalidField || 'email';
        }

        // Password check
        const passwordValidation = validatePassword(trimmedPassword, trimmedEmail);
        if (!passwordValidation.isValid) {
            setPasswordError(passwordValidation.message);
            hasError = true;
            firstInvalidField = firstInvalidField || 'password';
        }

        if (hasError) {
            if (firstInvalidField === 'email') {
                emailRef.current?.focus();
                error(emailValidation.message);
            } else if (firstInvalidField === 'password') {
                passwordRef.current?.focus();
                error(passwordValidation.message);
            }
            sessionStorage.setItem(FAILED_LOGIN_EMAIL_KEY, trimmedEmail);
            return;
        }

        setIsSubmitting(true);

        try {
            await handleLogin(trimmedEmail, trimmedPassword, rememberMe);
            sessionStorage.removeItem(FAILED_LOGIN_EMAIL_KEY);
            success(`Successfully logged in!`);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            const status = err.response?.status;
            const errData = err.response?.data;
            if (status === 403 && errData?.isDeleted && errData?.canRecover) {
                setRecoverableEmail(trimmedEmail);
                setDaysRemaining(errData.daysRemaining || 15);
                setRecoveryExpiresAt(formatDateToDDMMYYYY(errData.recoveryExpiresAt));
                setIsRecoveryModalOpen(true);
            } else if (status === 429) {
                const retryAfter = errData?.retryAfterSeconds || 300;
                setLockoutTimeRemaining(retryAfter);
                setIsLockedOut(true);
                setPasswordError(
                    errData?.message || err.message || 'Too many attempts. Account locked.',
                );
                error(errData?.message || err.message || 'Too many attempts. Account locked.');
            } else {
                const errMsg =
                    err.response?.data?.message || err.message || 'Invalid email or password';
                error(errMsg);
                if (errMsg.toLowerCase().includes('email')) {
                    setEmailError(errMsg);
                    emailRef.current?.focus();
                } else if (errMsg.toLowerCase().includes('password')) {
                    setPasswordError(errMsg);
                    passwordRef.current?.focus();
                } else {
                    setPasswordError(errMsg);
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = () => {
        navigate('/reset-password');
    };

    const handleSignUp = () => {
        navigate('/register');
    };

    return (
        <div className="form-panel">
            <div className="form-wrapper">
                <FormHeader
                    title="Welcome Back"
                    subtitle="Enter your email and password to access your account"
                />

                {/* Prominent Red Error Banner during Lockout */}
                {isLockedOut && (
                    <div className="lockout-banner" role="alert">
                        <ShieldAlert className="lockout-icon" size={22} />
                        <div className="lockout-content">
                            <span className="lockout-title">Account Temporarily Locked</span>
                            <span className="lockout-message">
                                Too many failed login attempts. Input fields have been disabled for
                                security.
                            </span>
                            <span className="lockout-timer-text">
                                Try again in: <span>{formatCountdown(lockoutTimeRemaining)}</span>
                            </span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate autoComplete="off">
                    {/* Hidden honeypot inputs to intercept browser credential autofill */}
                    <input
                        type="text"
                        name="fake-email"
                        style={{ display: 'none' }}
                        readOnly
                        tabIndex={-1}
                    />
                    <input
                        type="password"
                        name="fake-password"
                        style={{ display: 'none' }}
                        readOnly
                        tabIndex={-1}
                    />

                    <InputField
                        label="Email"
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError('');
                        }}
                        autoComplete="new-password"
                        error={emailError}
                        inputRef={emailRef}
                        disabled={isLockedOut}
                    />

                    <InputField
                        label="Password"
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError) setPasswordError('');
                        }}
                        autoComplete="new-password"
                        error={passwordError}
                        inputRef={passwordRef}
                        disabled={isLockedOut}
                    />

                    <RememberMe
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        onForgotPassword={handleForgotPassword}
                        disabled={isLockedOut}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="login-submit-btn"
                        disabled={isLockedOut}
                        loading={isSubmitting}
                    >
                        {isLockedOut
                            ? `Account Locked (${formatCountdown(lockoutTimeRemaining)})`
                            : 'Sign In'}
                    </Button>
                </form>

                <div className="oauth-divider">
                    <span>or continue with</span>
                </div>

                <div className="oauth-buttons">
                    <Button
                        type="button"
                        variant="secondary"
                        className="google-signin-btn"
                        disabled={isLockedOut}
                        onClick={() => {
                            window.location.href = '/api/auth/google';
                        }}
                    >
                        <svg
                            className="google-icon"
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </Button>
                </div>

                <SignupPrompt onSignUp={handleSignUp} />

                <Dialog
                    isOpen={isRecoveryModalOpen}
                    onClose={() => setIsRecoveryModalOpen(false)}
                    title="Recover Deleted Account?"
                    variant="warning"
                    size="sm"
                    confirmText="Recover Account"
                    cancelText="Cancel"
                    onConfirm={() => {
                        setIsRecoveryModalOpen(false);
                        navigate('/recover-account', { state: { email: recoverableEmail } });
                    }}
                >
                    <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9rem', color: '#374151' }}>
                        This account was deleted, but it is still within its recovery window.
                    </p>
                    <p
                        style={{
                            margin: '8px 0 0 0',
                            lineHeight: 1.5,
                            fontSize: '0.9rem',
                            color: '#374151',
                        }}
                    >
                        You have <strong>{daysRemaining} days</strong> remaining (until{' '}
                        {recoveryExpiresAt}) to restore this account and restore all of its data.
                    </p>
                </Dialog>
            </div>
        </div>
    );
}

export default LoginForm;
