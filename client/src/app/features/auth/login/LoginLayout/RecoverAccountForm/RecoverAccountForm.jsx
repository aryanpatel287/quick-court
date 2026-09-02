import { useState } from 'react';
import { useLocation } from 'react-router';

import FormHeader from '@/components/Shared/DataDisplay/FormHeader/FormHeader';
import InputField from '@/components/Shared/Form/InputField/InputField';
import Button from '@/components/Shared/Buttons/Button/Button';
import OtpVerificationForm from '@/components/Shared/Form/OtpVerificationForm/OtpVerificationForm';
import { validateEmail } from '@/utils/validation';
import { useToast } from '@/components/Shared/Feedback/Toast';
import { useAuth } from '../../../hooks/useAuth';
import './RecoverAccountForm.scss';

function RecoverAccountForm({ onNavigateToLogin }) {
    const location = useLocation();
    const { success, error } = useToast();
    const { handleRequestRecovery, handleVerifyRecovery } = useAuth();

    const [step, setStep] = useState('request'); // 'request' | 'verify'
    const [email, setEmail] = useState(() =>
        location.state && location.state.email ? location.state.email : '',
    );
    const [emailError, setEmailError] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [attemptsLeft, setAttemptsLeft] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setEmailError('');

        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.message);
            return;
        }

        setIsLoading(true);
        try {
            const response = await handleRequestRecovery(email);
            success(response.message || 'OTP sent successfully!');
            setAttemptsLeft(undefined);
            setOtpError('');
            setStep('verify');
        } catch (err) {
            console.error('Request recovery error:', err);
            const msg =
                err.response?.data?.message || err.message || 'Unable to request account recovery.';
            setEmailError(msg);
            error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        setOtpError('');

        const otpCode = otp.join('');
        if (otpCode.length < 6 || !/^[a-zA-Z0-9]{6}$/.test(otpCode)) {
            setOtpError('Please enter the complete 6-character OTP code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await handleVerifyRecovery(email, otpCode);
            success(response.message || 'Account recovered successfully!');
            onNavigateToLogin();
        } catch (err) {
            console.error('Verify recovery error:', err);
            const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP.';
            if (err.response?.data?.attemptsLeft !== undefined) {
                setAttemptsLeft(err.response.data.attemptsLeft);
            }
            setOtpError(msg);
            error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        try {
            const response = await handleRequestRecovery(email);
            success(response.message || 'OTP resent successfully!');
            setAttemptsLeft(undefined);
        } catch (err) {
            console.error('Resend OTP error:', err);
            const msg = err.response?.data?.message || err.message || 'Unable to resend OTP.';
            setOtpError(msg);
            error(msg);
            throw err;
        }
    };

    return (
        <div className="recover-account-panel">
            <div className="recover-account-wrapper">
                {step === 'request' && (
                    <>
                        <FormHeader
                            title="Recover Account"
                            subtitle="Enter the email address of your deleted account to receive a 6-digit verification code for account restoration."
                        />

                        <form onSubmit={handleRequestSubmit} noValidate>
                            <InputField
                                label="Email"
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError('');
                                }}
                                autoComplete="off"
                                error={emailError}
                                disabled={isLoading}
                            />

                            <Button type="submit" variant="primary" loading={isLoading}>
                                Send Verification Code
                            </Button>
                        </form>

                        <div className="back-to-login-prompt">
                            <button
                                type="button"
                                className="back-link"
                                onClick={onNavigateToLogin}
                                disabled={isLoading}
                            >
                                Back to Login
                            </button>
                        </div>
                    </>
                )}

                {step === 'verify' && (
                    <OtpVerificationForm
                        email={email}
                        otp={otp}
                        onChange={(newOtp) => {
                            setOtp(newOtp);
                            if (otpError) setOtpError('');
                        }}
                        onSubmit={handleVerifySubmit}
                        onBack={() => setStep('request')}
                        onResend={handleResend}
                        purpose="recover-account"
                        attemptsLeft={attemptsLeft}
                        error={otpError}
                        backText="Change Email"
                        submitText={isLoading ? 'Verifying...' : 'Restore Account'}
                        loading={isLoading}
                    />
                )}
            </div>
        </div>
    );
}

export default RecoverAccountForm;
