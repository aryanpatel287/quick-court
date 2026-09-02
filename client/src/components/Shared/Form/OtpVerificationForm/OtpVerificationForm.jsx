import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import FormHeader from '@/components/Shared/DataDisplay/FormHeader/FormHeader';
import Button from '@/components/Shared/Buttons/Button/Button';
import OtpInput from '@/components/Shared/Form/OtpInput/OtpInput';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import { useToast } from '@/components/Shared/Feedback/Toast';
import './OtpVerificationForm.scss';

/**
 * OtpVerificationForm — Shared OTP Verification form with live countdown timer,
 * inline email edit icon ✏️, and Change Email action link.
 */
export default function OtpVerificationForm({
    email,
    otp,
    onChange,
    onSubmit,
    onBack,
    onResend,
    resendCooldown = 120, // default matching policy
    ttlSeconds = 600, // default 10 minutes
    maxAttempts = 3,
    maxResends = 3,
    error,
    attemptsLeft,
    title = 'Verify OTP',
    subtitle = 'We sent a 6-digit verification code to the email address below.',
    submitText = 'Verify',
    backText = 'Change Email',
    resendPrompt = "Didn't receive the code?",
    resendText = 'Resend Code',
    loading = false,
    purpose, // 'verify' | 'forgot-password' | 'recover-account'
}) {
    const { success: toastSuccess, error: toastError } = useToast();
    const [timer, setTimer] = useState(resendCooldown);
    const [ttlTimer, setTtlTimer] = useState(ttlSeconds);
    const [isResending, setIsResending] = useState(false);
    const [resendCount, setResendCount] = useState(0);
    const [internalError, setInternalError] = useState('');

    const [prevResetKey, setPrevResetKey] = useState(
        () => `${email}-${purpose}-${ttlSeconds}-${resendCooldown}`,
    );
    const currentResetKey = `${email}-${purpose}-${ttlSeconds}-${resendCooldown}`;
    if (currentResetKey !== prevResetKey) {
        setPrevResetKey(currentResetKey);
        setTtlTimer(ttlSeconds);
        setTimer(resendCooldown);
        setInternalError('');
        setResendCount(0);
    }

    const isExpired = ttlTimer <= 0;
    const isLocked = attemptsLeft === 0;
    const isResendLimitReached = resendCount >= maxResends;

    // Cooldown timer effect
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timer]);

    // TTL timer effect
    useEffect(() => {
        let interval = null;
        if (ttlTimer > 0) {
            interval = setInterval(() => {
                setTtlTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [ttlTimer]);

    const handleResendClick = async () => {
        if (timer > 0 || isResending || isResendLimitReached || isLocked) return;
        setIsResending(true);
        setInternalError('');
        try {
            if (onResend) {
                await onResend();
                toastSuccess('Verification OTP code resent successfully.');
            }
            // Reset timers upon successful resend
            setTimer(resendCooldown);
            setTtlTimer(ttlSeconds);
            setResendCount((prev) => prev + 1);
            onChange(['', '', '', '', '', '']); // clear the OTP input
        } catch (err) {
            console.error('Error resending OTP:', err);
            const errMsg = err.response?.data?.message || err.message || 'Failed to resend OTP';
            toastError(errMsg);
            setInternalError(errMsg);

            // Handle custom server-side error data
            if (err.response?.data?.cooldownRemaining) {
                setTimer(Number(err.response.data.cooldownRemaining));
            }
            if (err.response?.data?.resendLimitReached) {
                setResendCount(maxResends);
            }
        } finally {
            setIsResending(false);
        }
    };

    const formatTtl = (seconds) => {
        const m = Math.floor(seconds / 60)
            .toString()
            .padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const displayError = error || internalError;

    return (
        <div className="otp-verification-step-wrapper">
            <FormHeader title={title} subtitle={subtitle} />

            {email && (
                <div className="otp-email-badge">
                    <div className="otp-email-chip">
                        <span className="otp-email-text">{email}</span>
                        {onBack && (
                            <Tooltip content="Change Email" position="top">
                                <button
                                    type="button"
                                    className="otp-email-edit-btn"
                                    onClick={onBack}
                                    aria-label="Change Email"
                                    disabled={loading || isResending}
                                >
                                    <Pencil size={13} />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>
            )}

            <form onSubmit={onSubmit} noValidate>
                <OtpInput
                    value={otp}
                    onChange={onChange}
                    error={displayError}
                    disabled={isExpired || isLocked || loading}
                />

                {attemptsLeft !== undefined &&
                    attemptsLeft > 0 &&
                    attemptsLeft < maxAttempts &&
                    !isExpired && (
                        <div className="otp-attempts-warning">
                            {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining
                        </div>
                    )}

                {isLocked && (
                    <div className="otp-locked-warning">
                        Too many attempts. Please request a new OTP.
                    </div>
                )}

                <div className="otp-expiry-container">
                    {isExpired ? (
                        <span className="otp-expired-text">
                            OTP has expired. Please request a new one.
                        </span>
                    ) : (
                        <span className="otp-ttl-text">
                            Code expires in{' '}
                            <strong className="ttl-count">{formatTtl(ttlTimer)}</strong>
                        </span>
                    )}
                </div>

                <div className="otp-resend-container">
                    <span className="resend-prompt">{resendPrompt}</span>{' '}
                    {timer > 0 ? (
                        <span className="resend-timer-text">
                            Resend in <strong className="timer-count">{timer}s</strong>
                        </span>
                    ) : isResendLimitReached ? (
                        <span className="resend-limit-text">Resend limit reached</span>
                    ) : (
                        <button
                            type="button"
                            className="resend-code-btn"
                            onClick={handleResendClick}
                            disabled={isResending || isLocked}
                        >
                            {isResending ? 'Resending...' : resendText}
                        </button>
                    )}
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={isExpired || isLocked || loading}
                >
                    {submitText}
                </Button>
            </form>

            {onBack && (
                <div className="back-to-login-prompt">
                    <button
                        type="button"
                        className="back-link"
                        onClick={onBack}
                        disabled={loading || isResending}
                    >
                        {backText}
                    </button>
                </div>
            )}
        </div>
    );
}
