import { useState } from 'react';

import FormHeader from '@/components/Shared/DataDisplay/FormHeader/FormHeader';
import InputField from '@/components/Shared/Form/InputField/InputField';
import Button from '@/components/Shared/Buttons/Button/Button';
import OtpVerificationForm from '@/components/Shared/Form/OtpVerificationForm/OtpVerificationForm';
import { validateEmail, validatePassword } from '@/utils/validation';
import { useToast } from '@/components/Shared/Feedback/Toast';
import { useAuth } from '../../../hooks/useAuth';
import './ForgotPasswordForm.scss';

function ForgotPasswordForm({ onNavigateToLogin }) {
    const [step, setStep] = useState('request'); // 'request' | 'verify' | 'reset'
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordError, setNewPasswordError] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [attemptsLeft, setAttemptsLeft] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const { success, error: toastError } = useToast();
    const { handleRequestPasswordReset, handleVerifyForgotPasswordOtp, handleResetPassword } =
        useAuth();

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
            await handleRequestPasswordReset(email);
            success('OTP code sent successfully! Please check your inbox.');
            setAttemptsLeft(undefined);
            setOtpError('');
            setStep('verify');
        } catch (err) {
            console.error('Request reset OTP error:', err);
            const msg =
                err.response?.data?.message || err.message || 'Unable to request password reset.';
            setEmailError(msg);
            toastError(msg);
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
            await handleVerifyForgotPasswordOtp({ email, otp: otpCode });
            success('OTP verified successfully!');
            setStep('reset');
        } catch (err) {
            console.error('Verify reset OTP error:', err);
            const msg = err.response?.data?.message || err.message || 'OTP verification failed.';
            if (err.response?.data?.attemptsLeft !== undefined) {
                setAttemptsLeft(err.response.data.attemptsLeft);
            }
            setOtpError(msg);
            toastError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setNewPasswordError('');
        setConfirmPasswordError('');

        let hasError = false;
        const trimmedNew = newPassword.trim();
        const trimmedConfirm = confirmPassword.trim();

        const passwordValidation = validatePassword(trimmedNew, email);
        if (!passwordValidation.isValid) {
            setNewPasswordError(passwordValidation.message);
            hasError = true;
        }

        if (!trimmedConfirm) {
            setConfirmPasswordError('Please confirm your password');
            hasError = true;
        } else if (trimmedConfirm !== trimmedNew) {
            setConfirmPasswordError('Passwords do not match');
            hasError = true;
        }

        if (hasError) return;

        setIsLoading(true);
        const otpCode = otp.join('');
        try {
            await handleResetPassword({
                email,
                otp: otpCode,
                password: trimmedNew,
                confirmPassword: trimmedConfirm,
            });
            success('Password reset successfully! You can now log in.');
            onNavigateToLogin();
        } catch (err) {
            console.error('Reset password error:', err);
            const msg = err.response?.data?.message || err.message || 'Password reset failed.';

            // Check if error is OTP/code related. If so, return back to OTP step
            const isOtpError =
                err.response?.status === 429 ||
                err.response?.data?.attemptsLeft !== undefined ||
                msg.toLowerCase().includes('otp') ||
                msg.toLowerCase().includes('code');

            if (isOtpError) {
                if (err.response?.data?.attemptsLeft !== undefined) {
                    setAttemptsLeft(err.response.data.attemptsLeft);
                }
                setOtpError(msg);
                setStep('verify');
            } else {
                setNewPasswordError(msg);
            }
            toastError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-password-panel">
            <div className="forgot-password-wrapper">
                {step === 'request' && (
                    <>
                        <FormHeader
                            title="Forgot Password"
                            subtitle="Enter your email address and we'll send you a 6-digit OTP code to reset your password."
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
                                Reset Password
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
                        purpose="forgot-password"
                        attemptsLeft={attemptsLeft}
                        error={otpError}
                        backText="Change Email"
                        loading={isLoading}
                    />
                )}

                {step === 'reset' && (
                    <>
                        <FormHeader
                            title="Reset Password"
                            subtitle="Create a new strong password for your account"
                        />

                        <form onSubmit={handleResetSubmit} noValidate>
                            <InputField
                                label="New Password"
                                id="new-password"
                                type="password"
                                placeholder="Enter your new password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (newPasswordError) setNewPasswordError('');
                                }}
                                autoComplete="new-password"
                                error={newPasswordError}
                                disabled={isLoading}
                            />

                            <InputField
                                label="Confirm Password"
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm your new password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (confirmPasswordError) setConfirmPasswordError('');
                                }}
                                autoComplete="new-password"
                                error={confirmPasswordError}
                                disabled={isLoading}
                            />

                            <Button type="submit" variant="primary" loading={isLoading}>
                                Update Password
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default ForgotPasswordForm;
