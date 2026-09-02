import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as authService from '../services/api';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    const { user, setUser, loading, setLoading, error, setError } = context;

    const handleGetMe = async (forceReload = false) => {
        if (!forceReload && user) return user;

        setLoading(true);
        setError(null);
        try {
            const data = await authService.getMe();
            const userData = data?.user || null;
            setUser(userData);
            return userData;
        } catch (err) {
            console.error('Error in handleGetMe:', err);
            setUser(null);
            setError(err.response?.data?.message || err.message || 'Session expired');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (email, password, role, rememberMe) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.login({ email, password, role, rememberMe });
            const userData = data?.user || null;
            setUser(userData);
            return data;
        } catch (err) {
            console.error('Error in handleLogin:', err);
            setError(err.response?.data?.message || err.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    //TODO: on logout if failed show toast error
    const handleLogout = async () => {
        setLoading(true);
        try {
            await authService.logout();
        } catch (err) {
            console.error('Error in handleLogout:', err);
        } finally {
            setUser(null);
            setLoading(false);
        }
    };

    const handleRequestRecovery = async (email) => {
        setError(null);
        try {
            return await authService.requestAccountRecovery({ email });
        } catch (err) {
            console.error('Error in handleRequestRecovery:', err);
            setError(err.response?.data?.message || err.message || 'Recovery request failed');
            throw err;
        }
    };

    const handleVerifyRecovery = async (email, otp) => {
        setError(null);
        try {
            return await authService.verifyAccountRecovery({ email, otp });
        } catch (err) {
            console.error('Error in handleVerifyRecovery:', err);
            setError(err.response?.data?.message || err.message || 'Recovery verification failed');
            throw err;
        }
    };

    const handleSendVerificationOtp = async (email) => {
        setError(null);
        try {
            return await authService.sendVerificationOtp({ email });
        } catch (err) {
            console.error('Error in handleSendVerificationOtp:', err);
            setError(
                err.response?.data?.message || err.message || 'Failed to send verification OTP',
            );
            throw err;
        }
    };

    const handleVerifyEmail = async (email, otp) => {
        setError(null);
        try {
            return await authService.verifyEmail({ email, otp });
        } catch (err) {
            console.error('Error in handleVerifyEmail:', err);
            setError(err.response?.data?.message || err.message || 'OTP verification failed');
            throw err;
        }
    };

    const handleRegister = async ({ firstName, lastName, email, password, role, profileImage }) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.register({
                firstName,
                lastName,
                email,
                password,
                role,
                profileImage,
            });
            const userData = data.user || data.data?.user || null;
            setUser(userData);
            return data;
        } catch (err) {
            console.error('Error in handleRegister:', err);
            setError(err.response?.data?.message || err.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async ({ firstName, lastName, profileImage }) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.updateProfile({ firstName, lastName, profileImage });
            const userData = data.user || data.data?.user || null;
            if (userData) {
                setUser((prev) => ({
                    ...prev,
                    ...userData,
                }));
            }
            return data;
        } catch (err) {
            console.error('Error in handleUpdateProfile:', err);
            setError(err.response?.data?.message || err.message || 'Profile update failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAvatar = async (file) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.uploadAvatar(file);
            const userData = data.user || data.data?.user || null;
            if (userData) {
                setUser((prev) => ({
                    ...prev,
                    ...userData,
                    profileImage: userData.profileImage || data.imageUrl || prev.profileImage,
                }));
            }
            return data;
        } catch (err) {
            console.error('Error in handleUploadAvatar:', err);
            setError(err.response?.data?.message || err.message || 'Avatar upload failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPasswordReset = async (email) => {
        setError(null);
        try {
            return await authService.requestPasswordReset({ email });
        } catch (err) {
            console.error('Error in handleRequestPasswordReset:', err);
            setError(
                err.response?.data?.message || err.message || 'Failed to send password reset OTP',
            );
            throw err;
        }
    };

    const handleVerifyForgotPasswordOtp = async ({ email, otp }) => {
        setError(null);
        try {
            return await authService.verifyForgotPasswordOtp({ email, otp });
        } catch (err) {
            console.error('Error in handleVerifyForgotPasswordOtp:', err);
            setError(err.response?.data?.message || err.message || 'OTP verification failed');
            throw err;
        }
    };

    const handleResetPassword = async ({ email, otp, password, confirmPassword }) => {
        setError(null);
        try {
            return await authService.resetPassword({ email, otp, password, confirmPassword });
        } catch (err) {
            console.error('Error in handleResetPassword:', err);
            setError(err.response?.data?.message || err.message || 'Password reset failed');
            throw err;
        }
    };

    const handleChangePassword = async ({ currentPassword, newPassword }) => {
        setLoading(true);
        setError(null);
        try {
            return await authService.changePassword({ currentPassword, newPassword });
        } catch (err) {
            console.error('Error in handleChangePassword:', err);
            setError(err.response?.data?.message || err.message || 'Change password failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async ({ password }) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.deleteAccount({ password });
            setUser(null);
            return data;
        } catch (err) {
            console.error('Error in handleDeleteAccount:', err);
            setError(err.response?.data?.message || err.message || 'Delete account failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        setUser,
        loading,
        setLoading,
        error,
        setError,
        handleGetMe,
        handleLogin,
        handleLogout,
        handleRequestRecovery,
        handleVerifyRecovery,
        handleSendVerificationOtp,
        handleVerifyEmail,
        handleRegister,
        handleUpdateProfile,
        handleUploadAvatar,
        handleRequestPasswordReset,
        handleVerifyForgotPasswordOtp,
        handleResetPassword,
        handleChangePassword,
        handleDeleteAccount,
    };
};
