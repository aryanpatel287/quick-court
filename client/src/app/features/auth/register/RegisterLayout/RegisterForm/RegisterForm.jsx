import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import FormHeader from '@/components/Shared/DataDisplay/FormHeader/FormHeader';
import InputField from '@/components/Shared/Form/InputField/InputField';
import Button from '@/components/Shared/Buttons/Button/Button';
import SigninPrompt from './SigninPrompt/SigninPrompt';
import { useToast } from '@/components/Shared/Feedback/Toast';
import Upload from '@/components/Shared/Form/Upload/Upload';
import OtpVerificationForm from '@/components/Shared/Form/OtpVerificationForm/OtpVerificationForm';
import { validateEmail, validatePassword } from '@/utils/validation';
import { useAuth } from '../../../hooks/useAuth';
import { DEFAULT_AVATAR_URL } from '@/utils/avatar';
import './RegisterForm.scss';

function RegisterForm({ role = 'USER' }) {
    const navigate = useNavigate();

    const handleNavigateToLogin = () => {
        navigate('/login');
    };

    const { success, error: toastError } = useToast();
    const {
        loading: authLoading,
        handleSendVerificationOtp,
        handleVerifyEmail,
        handleRegister,
    } = useAuth();

    // Wizard state: 'details' | 'verify' | 'setup' | 'photo'
    const [step, setStep] = useState('details');

    // Steps definition for progress tracker
    const stepsList = [
        { id: 'details', label: 'Details' },
        { id: 'verify', label: 'Verify' },
        { id: 'setup', label: 'Setup' },
        { id: 'photo', label: 'Avatar' },
    ];

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [attemptsLeft, setAttemptsLeft] = useState(undefined);

    // Error states
    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const getPasswordValidationMessage = (password) => {
        return validatePassword(password, email).message;
    };

    const firstNameRef = useRef(null);
    const lastNameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    // Step 1: Details Submit
    const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        if (authLoading) return;

        let hasError = false;
        setFirstNameError('');
        setLastNameError('');
        setEmailError('');

        let firstInvalidRef = null;
        const nameRegex = /^[A-Za-z]+(?:[\s'-][A-Za-z]+)*$/;

        // First Name check
        const trimmedFirst = firstName.trim();
        if (!trimmedFirst) {
            setFirstNameError('Please enter your first name');
            hasError = true;
            firstInvalidRef = firstInvalidRef || firstNameRef;
        } else if (trimmedFirst.length < 2) {
            setFirstNameError('First name must be at least 2 characters');
            hasError = true;
            firstInvalidRef = firstInvalidRef || firstNameRef;
        } else if (!nameRegex.test(trimmedFirst)) {
            setFirstNameError(
                'First name can only contain letters, spaces, hyphens, and apostrophes',
            );
            hasError = true;
            firstInvalidRef = firstInvalidRef || firstNameRef;
        }

        // Last Name check
        const trimmedLast = lastName.trim();
        if (!trimmedLast) {
            setLastNameError('Please enter your last name');
            hasError = true;
            firstInvalidRef = firstInvalidRef || lastNameRef;
        } else if (trimmedLast.length < 2) {
            setLastNameError('Last name must be at least 2 characters');
            hasError = true;
            firstInvalidRef = firstInvalidRef || lastNameRef;
        } else if (!nameRegex.test(trimmedLast)) {
            setLastNameError(
                'Last name can only contain letters, spaces, hyphens, and apostrophes',
            );
            hasError = true;
            firstInvalidRef = firstInvalidRef || lastNameRef;
        }

        // Email check
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.message);
            hasError = true;
            firstInvalidRef = firstInvalidRef || emailRef;
        }

        if (hasError) {
            firstInvalidRef?.current?.focus();
            return;
        }

        try {
            await handleSendVerificationOtp(email);
            success('Verification OTP code sent to your email.');
            setAttemptsLeft(undefined);
            setOtpError('');
            setStep('verify');
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to send OTP';
            toastError(msg);
            setEmailError(msg);
        }
    };

    // Step 2: OTP Submit
    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        if (authLoading) return;
        setOtpError('');

        const otpCode = otp.join('');
        if (otpCode.length < 6 || !/^[a-zA-Z0-9]{6}$/.test(otpCode)) {
            setOtpError('Please enter the complete 6-character OTP code');
            return;
        }

        try {
            await handleVerifyEmail(email, otpCode);
            success('Email verified successfully!');
            setStep('setup');
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'OTP verification failed';
            if (err.response?.data?.attemptsLeft !== undefined) {
                setAttemptsLeft(err.response.data.attemptsLeft);
            }
            toastError(msg);
            setOtpError(msg);
        }
    };

    const handleResendOtp = async () => {
        if (authLoading) return;
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        try {
            await handleSendVerificationOtp(email);
            success('Verification OTP code resent successfully.');
            setAttemptsLeft(undefined);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to resend OTP';
            toastError(msg);
            setOtpError(msg);
            throw err;
        }
    };

    // Step 3: Setup Password Submit
    const handleSetupSubmit = (e) => {
        e.preventDefault();
        setPasswordError('');

        const passwordValidation = validatePassword(password, email);
        if (!passwordValidation.isValid) {
            setPasswordError(passwordValidation.message);
            passwordRef.current?.focus();
            return;
        }

        setStep('photo');
    };

    // Step 4: Final Sign Up Submit
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (authLoading) return;

        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const fullName = `${trimmedFirst} ${trimmedLast}`;

        try {
            await handleRegister({
                firstName: trimmedFirst,
                lastName: trimmedLast,
                email: trimmedEmail,
                password: trimmedPassword,
                role,
                profileImage: avatar || DEFAULT_AVATAR_URL,
            });
            success(`Welcome, ${fullName}! Account created successfully.`);
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Registration failed';
            toastError(msg);
        }
    };

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const isFacilityOwner = role === 'FACILITY_OWNER';

    return (
        <div className="form-panel">
            <div className="form-wrapper">
                {/* Clean Segmented Progress Bar with Labels */}
                <div className="registration-progress-bar-clean">
                    {stepsList.map((s, idx) => {
                        const stepIndex = stepsList.findIndex((x) => x.id === step);
                        const isActiveOrCompleted = idx <= stepIndex;
                        const isActive = idx === stepIndex;
                        const isCompleted = idx < stepIndex;

                        return (
                            <div
                                key={s.id}
                                className={`progress-segment-wrapper ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            >
                                <div
                                    className={`progress-segment ${isActiveOrCompleted ? 'active' : ''}`}
                                />
                                <span className="step-label">{s.label}</span>
                            </div>
                        );
                    })}
                </div>

                {step === 'details' && (
                    <>
                        <FormHeader
                            title={
                                isFacilityOwner ? 'Partner Registration' : 'Create Player Account'
                            }
                            subtitle={
                                isFacilityOwner
                                    ? 'Enter your details to register as a facility owner'
                                    : 'Enter your name and email to start verification'
                            }
                        />

                        <form onSubmit={handleDetailsSubmit} noValidate>
                            <div className="names-row">
                                <InputField
                                    label="First Name"
                                    id="firstName"
                                    type="text"
                                    placeholder="First name"
                                    value={firstName}
                                    onChange={(e) => {
                                        setFirstName(e.target.value);
                                        if (firstNameError) setFirstNameError('');
                                    }}
                                    autoComplete="given-name"
                                    error={firstNameError}
                                    inputRef={firstNameRef}
                                    disabled={authLoading}
                                />

                                <InputField
                                    label="Last Name"
                                    id="lastName"
                                    type="text"
                                    placeholder="Last name"
                                    value={lastName}
                                    onChange={(e) => {
                                        setLastName(e.target.value);
                                        if (lastNameError) setLastNameError('');
                                    }}
                                    autoComplete="family-name"
                                    error={lastNameError}
                                    inputRef={lastNameRef}
                                    disabled={authLoading}
                                />
                            </div>

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
                                autoComplete="email"
                                error={emailError}
                                inputRef={emailRef}
                                disabled={authLoading}
                            />

                            <Button type="submit" variant="primary" loading={authLoading}>
                                Verify
                            </Button>
                        </form>

                        <SigninPrompt onSignIn={handleNavigateToLogin} />
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
                        onBack={() => setStep('details')}
                        onResend={handleResendOtp}
                        purpose="verify"
                        attemptsLeft={attemptsLeft}
                        error={otpError}
                        title="Verify Email"
                        submitText="Verify OTP"
                        backText="Change Email"
                        loading={authLoading}
                    />
                )}

                {step === 'setup' && (
                    <>
                        <FormHeader
                            title="Setup Password"
                            subtitle={
                                isFacilityOwner
                                    ? 'Create a secure password for your facility owner account'
                                    : 'Create a secure password for your player account'
                            }
                        />

                        <form onSubmit={handleSetupSubmit} noValidate>
                            <InputField
                                label="Password"
                                id="password"
                                type="password"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => {
                                    const newPassword = e.target.value;
                                    setPassword(newPassword);
                                    setPasswordError(getPasswordValidationMessage(newPassword));
                                }}
                                autoComplete="new-password"
                                error={passwordError}
                                inputRef={passwordRef}
                                disabled={authLoading}
                            />

                            <Button type="submit" variant="primary" loading={authLoading}>
                                Continue
                            </Button>
                        </form>

                        <div className="back-to-login-prompt">
                            <button
                                type="button"
                                className="back-link"
                                onClick={() => setStep('verify')}
                                disabled={authLoading}
                            >
                                Back to OTP Verification
                            </button>
                        </div>
                    </>
                )}

                {step === 'photo' && (
                    <>
                        <FormHeader
                            title="Add Profile Photo"
                            subtitle="Upload an avatar image to personalize your account profile"
                        />

                        <form onSubmit={handleFinalSubmit} noValidate>
                            <Upload
                                variant="avatar"
                                value={avatar}
                                onChange={setAvatar}
                                name={fullName}
                                size={110}
                                disabled={authLoading}
                            />

                            <Button type="submit" variant="primary" loading={authLoading}>
                                Sign Up
                            </Button>
                        </form>

                        <div className="back-to-login-prompt">
                            <button
                                type="button"
                                className="back-link"
                                onClick={() => setStep('setup')}
                                disabled={authLoading}
                            >
                                Back to Account Setup
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default RegisterForm;
