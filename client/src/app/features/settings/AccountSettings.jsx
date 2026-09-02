import { useState } from 'react';
import { useNavigate } from 'react-router';
import InputField from '@/components/Shared/Form/InputField/InputField';
import Upload from '@/components/Shared/Form/Upload/Upload';
import Button from '@/components/Shared/Buttons/Button/Button';
import Dialog from '@/components/Shared/Feedback/Dialog';
import { useToast } from '@/components/Shared/Feedback/Toast';
import { useAuth } from '../auth/hooks/useAuth';
import { DEFAULT_AVATAR_URL, getAvatarUrl } from '@/utils/avatar';
import './AccountSettings.scss';

export default function AccountSettings() {
    const auth = useAuth();
    const { handleUpdateProfile, handleUploadAvatar, handleChangePassword, handleDeleteAccount } =
        auth;
    const { success, error } = useToast();
    const navigate = useNavigate();

    const user = auth.user;

    const emailVal = user ? user.email || '' : '';
    const roleVal = user ? user.role || 'USER' : 'USER';
    const usernameVal = emailVal ? `@${emailVal.split('@')[0]}` : '';

    const profileData = {
        email: emailVal,
        role: roleVal,
        username: usernameVal,
        avatarUrl: user?.profileImage,
    };

    // Form states initialized directly from user profile
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const username = profileData.username;
    const [email, setEmail] = useState(profileData.email || '');
    const [avatarUrl, setAvatarUrl] = useState(() => getAvatarUrl(profileData.avatarUrl));

    // Pending avatar update/removal states
    const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
    const [pendingAvatarRemove, setPendingAvatarRemove] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Change Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Delete Account States
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Errors state
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        username: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        let hasErrors = false;
        const newErrors = { firstName: '', lastName: '', username: '' };
        const nameRegex = /^[A-Za-z]+(?:[\s'-][A-Za-z]+)*$/;

        // First Name check
        const trimmedFirst = firstName.trim();
        if (!trimmedFirst) {
            newErrors.firstName = 'First name is required';
            hasErrors = true;
        } else if (trimmedFirst.length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters';
            hasErrors = true;
        } else if (!nameRegex.test(trimmedFirst)) {
            newErrors.firstName =
                'First name can only contain letters, spaces, hyphens, and apostrophes';
            hasErrors = true;
        }

        // Last Name check
        const trimmedLast = lastName.trim();
        if (!trimmedLast) {
            newErrors.lastName = 'Last name is required';
            hasErrors = true;
        } else if (trimmedLast.length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters';
            hasErrors = true;
        } else if (!nameRegex.test(trimmedLast)) {
            newErrors.lastName =
                'Last name can only contain letters, spaces, hyphens, and apostrophes';
            hasErrors = true;
        }

        if (!username.trim()) {
            newErrors.username = 'Username is required';
            hasErrors = true;
        }

        if (hasErrors) {
            setErrors(newErrors);
            error('Please fix the errors in the form.');
            return;
        }

        setIsSaving(true);
        try {
            if (pendingAvatarRemove) {
                await handleUpdateProfile({
                    firstName: trimmedFirst,
                    lastName: trimmedLast,
                    profileImage: DEFAULT_AVATAR_URL,
                });
            } else if (pendingAvatarFile) {
                await handleUploadAvatar(pendingAvatarFile);
                await handleUpdateProfile({
                    firstName: trimmedFirst,
                    lastName: trimmedLast,
                });
            } else {
                await handleUpdateProfile({
                    firstName: trimmedFirst,
                    lastName: trimmedLast,
                });
            }
            setPendingAvatarFile(null);
            setPendingAvatarRemove(false);
            success('Profile details updated successfully!');
        } catch (err) {
            error(
                err.response?.data?.message || err.message || 'Failed to update profile details.',
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();

        let hasErrors = false;
        const newErrors = { currentPassword: '', newPassword: '', confirmPassword: '' };

        if (!currentPassword) {
            newErrors.currentPassword = 'Current password is required';
            hasErrors = true;
        }

        if (!newPassword) {
            newErrors.newPassword = 'New password is required';
            hasErrors = true;
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'New password must be at least 6 characters long';
            hasErrors = true;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
            hasErrors = true;
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            hasErrors = true;
        }

        if (newPassword === currentPassword && currentPassword) {
            newErrors.newPassword = 'New password must be different from current password';
            hasErrors = true;
        }

        if (hasErrors) {
            setPasswordErrors(newErrors);
            error('Please fix the errors in the password form.');
            return;
        }

        setIsChangingPassword(true);
        try {
            await handleChangePassword({ currentPassword, newPassword });
            success('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            error(err.response?.data?.message || err.message || 'Failed to change password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccountConfirm = async () => {
        if (!deleteConfirmPassword) {
            setDeleteError('Password is required to confirm deletion.');
            return;
        }

        setIsDeletingAccount(true);
        setDeleteError('');
        try {
            await handleDeleteAccount({ password: deleteConfirmPassword });
            success('Your account has been deleted.');
            setIsDeleteDialogOpen(false);
            setDeleteConfirmPassword('');
            navigate('/login');
        } catch (err) {
            setDeleteError(
                err.response?.data?.message || err.message || 'Failed to delete account.',
            );
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleAvatarChange = (newAvatarUrl) => {
        if (!newAvatarUrl) {
            handleAvatarRemove();
            return;
        }

        try {
            const blob = dataURLtoBlob(newAvatarUrl);
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

            setPendingAvatarFile(file);
            setPendingAvatarRemove(false);
            setAvatarUrl(newAvatarUrl);
        } catch (err) {
            error('Failed to parse avatar: ' + (err.message || ''));
        }
    };

    const handleAvatarRemove = () => {
        setAvatarUrl(DEFAULT_AVATAR_URL);
        setPendingAvatarFile(null);
        setPendingAvatarRemove(true);
    };

    function dataURLtoBlob(dataurl) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    return (
        <div className="account-settings-container" key={user?.email || 'loading'}>
            <div className="settings-card-header">
                <h2 className="settings-card-title">Profile Settings</h2>
                <p className="settings-card-subtitle">
                    Manage your public information and avatar photo
                </p>
            </div>

            <form onSubmit={handleSubmit} className="account-settings-form">
                {/* Photo Upload Section */}
                <div className="avatar-section-card">
                    <label className="section-label">Profile Picture</label>
                    <div className="avatar-upload-wrapper">
                        <Upload
                            variant="avatar"
                            value={avatarUrl}
                            onChange={handleAvatarChange}
                            onRemove={handleAvatarRemove}
                            name={fullName}
                            size={120}
                            disabled={isSaving}
                        />
                    </div>
                </div>

                {/* Inputs Fields Grid */}
                <div className="form-fields-grid">
                    <div className="form-field-wrapper">
                        <InputField
                            label="First Name"
                            id="settings-firstName"
                            type="text"
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => {
                                setFirstName(e.target.value);
                                if (errors.firstName)
                                    setErrors((prev) => ({ ...prev, firstName: '' }));
                            }}
                            error={errors.firstName}
                            disabled={isSaving}
                        />
                    </div>

                    <div className="form-field-wrapper">
                        <InputField
                            label="Last Name"
                            id="settings-lastName"
                            type="text"
                            placeholder="Last name"
                            value={lastName}
                            onChange={(e) => {
                                setLastName(e.target.value);
                                if (errors.lastName)
                                    setErrors((prev) => ({ ...prev, lastName: '' }));
                            }}
                            error={errors.lastName}
                            disabled={isSaving}
                        />
                    </div>

                    <div className="form-field-wrapper">
                        <InputField
                            label="Email Address"
                            id="settings-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={true} // email usually read-only or requires verify flow
                        />
                        <span className="field-hint-text">
                            Contact administrator to update login email.
                        </span>
                    </div>
                </div>

                {/* Submit button is always active */}
                <div className="settings-footer-actions">
                    <Button type="submit" variant="primary" loading={isSaving} disabled={isSaving}>
                        Save Details
                    </Button>
                </div>
            </form>

            {/* Divider */}
            <div className="settings-divider" />

            {/* Change Password Section */}
            <div className="settings-card-header">
                <h2 className="settings-card-title">Change Password</h2>
                <p className="settings-card-subtitle">
                    Update your password to keep your account secure
                </p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="account-settings-form">
                <div className="form-fields-grid">
                    <div className="form-field-wrapper">
                        <InputField
                            label="Current Password"
                            id="settings-currentPassword"
                            type="password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                if (passwordErrors.currentPassword)
                                    setPasswordErrors((prev) => ({ ...prev, currentPassword: '' }));
                            }}
                            error={passwordErrors.currentPassword}
                            disabled={isChangingPassword}
                        />
                    </div>
                    <div className="form-field-wrapper">
                        <InputField
                            label="New Password"
                            id="settings-newPassword"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (passwordErrors.newPassword)
                                    setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                            }}
                            error={passwordErrors.newPassword}
                            disabled={isChangingPassword}
                        />
                    </div>
                    <div className="form-field-wrapper">
                        <InputField
                            label="Confirm New Password"
                            id="settings-confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (passwordErrors.confirmPassword)
                                    setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                            }}
                            error={passwordErrors.confirmPassword}
                            disabled={isChangingPassword}
                        />
                    </div>
                </div>

                <div className="settings-footer-actions">
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isChangingPassword}
                        disabled={isChangingPassword}
                    >
                        Update Password
                    </Button>
                </div>
            </form>

            {/* Divider */}
            <div className="settings-divider" />

            {/* Delete Account Section */}
            <div className="settings-card-header danger-zone-header">
                <h2 className="settings-card-title danger-title">Danger Zone</h2>
                <p className="settings-card-subtitle">
                    Irreversible administrative actions for your account
                </p>
            </div>

            <div className="danger-zone-card">
                <div className="danger-zone-info">
                    <h4 className="danger-zone-item-title">Delete Account</h4>
                    <p className="danger-zone-item-desc">
                        Permanently delete your account and all associated data. This action cannot
                        be undone.
                    </p>
                </div>
                <div className="danger-zone-action">
                    <Button
                        type="button"
                        variant="danger-outline"
                        size="md"
                        onClick={() => setIsDeleteDialogOpen(true)}
                    >
                        Delete Account
                    </Button>
                </div>
            </div>

            {/* Delete Account Confirmation Dialog */}
            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    if (!isDeletingAccount) {
                        setIsDeleteDialogOpen(false);
                        setDeleteConfirmPassword('');
                        setDeleteError('');
                    }
                }}
                title="Delete Account"
                variant="danger"
                confirmText="Permanently Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteAccountConfirm}
                confirmLoading={isDeletingAccount}
                confirmDisabled={!deleteConfirmPassword}
            >
                <div className="delete-confirmation-dialog-content">
                    <p className="delete-warning-text">
                        Are you absolutely sure you want to delete your account? This action is{' '}
                        <strong>irreversible</strong> and will delete all your settings, data, and
                        access.
                    </p>
                    <p className="delete-instruction-text">
                        Please enter your current password to confirm deletion:
                    </p>
                    <div className="delete-password-input-wrapper">
                        <InputField
                            label="Current Password"
                            id="settings-deleteConfirmPassword"
                            type="password"
                            placeholder="Enter password to confirm"
                            value={deleteConfirmPassword}
                            onChange={(e) => {
                                setDeleteConfirmPassword(e.target.value);
                                if (deleteError) setDeleteError('');
                            }}
                            error={deleteError}
                            disabled={isDeletingAccount}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
