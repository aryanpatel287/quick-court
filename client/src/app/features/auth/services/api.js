import axios from 'axios';

const authApiInstance = axios.create({
    baseURL: '/api/auth',
    withCredentials: true,
});

const userApiInstance = axios.create({
    baseURL: '/api/users',
    withCredentials: true,
});

export async function register({ firstName, lastName, email, password, profileImage, role }) {
    const response = await authApiInstance.post('/register', {
        firstName,
        lastName,
        email,
        password,
        profileImage,
        role,
    });
    return response.data;
}

export async function sendVerificationOtp({ email }) {
    const response = await authApiInstance.post('/send-verification-otp', {
        email,
    });
    return response.data;
}

export async function updateProfile({ firstName, lastName, profileImage }) {
    const response = await userApiInstance.patch('/profile', {
        firstName,
        lastName,
        profileImage,
    });
    return response.data;
}

export async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await userApiInstance.patch('/profile/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

export async function login({ email, password, role, rememberMe }) {
    const response = await authApiInstance.post('/login', {
        email,
        password,
        role,
        rememberMe,
    });
    return response.data;
}

export async function verifyEmail({ email, otp }) {
    const response = await authApiInstance.post('/verify-email', {
        email,
        otp,
    });
    return response.data;
}

export async function resendOtp({ email, purpose }) {
    const response = await authApiInstance.post('/resend-otp', {
        email,
        purpose,
    });
    return response.data;
}

export async function requestPasswordReset({ email }) {
    const response = await authApiInstance.post('/forgot-password', {
        email,
    });
    return response.data;
}

export async function verifyForgotPasswordOtp({ email, otp }) {
    const response = await authApiInstance.post('/verify-forgot-password-otp', {
        email,
        otp,
    });
    return response.data;
}

export async function resetPassword({ email, otp, password, confirmPassword }) {
    const response = await authApiInstance.post('/reset-password', {
        email,
        otp,
        password,
        confirmPassword,
    });
    return response.data;
}

export async function logout() {
    try {
        await authApiInstance.post('/logout');
    } catch (err) {
        console.error('Logout Failed', err);
    }
}

export async function getMe() {
    const response = await authApiInstance.get('/get-me');
    return response.data;
}

export async function requestAccountRecovery({ email }) {
    const response = await authApiInstance.post('/recover-account/request', {
        email,
    });
    return response.data;
}

export async function verifyAccountRecovery({ email, otp }) {
    const response = await authApiInstance.post('/recover-account/verify', {
        email,
        otp,
    });
    return response.data;
}

export async function changePassword({ currentPassword, newPassword }) {
    const response = await userApiInstance.patch('/change-password', {
        currentPassword,
        newPassword,
    });
    return response.data;
}

export async function deleteAccount({ password }) {
    const response = await userApiInstance.delete('/me', {
        data: { password },
    });
    return response.data;
}
