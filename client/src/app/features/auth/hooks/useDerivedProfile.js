import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { getAvatarUrl } from '@/utils/avatar';

/**
 * Derives a display-ready profileData object from the authenticated user.
 * Any component that needs profile display info should call this hook directly
 * instead of receiving profileData as a prop.
 *
 * @returns {{ id, name, role, username, avatarUrl, initials, email }}
 */
export function useDerivedProfile() {
    const { user } = useAuth();

    return useMemo(() => {
        const name =
            user && user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '';
        const email = user ? user.email || '' : '';
        const role = user ? user.role || 'USER' : 'USER';

        const nameParts = name.trim().split(/\s+/);
        const initials =
            nameParts.length >= 2
                ? (nameParts[0][0] || '') + (nameParts[1][0] || '')
                : nameParts[0]
                  ? nameParts[0][0] || ''
                  : 'U';

        const username = email ? `@${email.split('@')[0]}` : '';

        return {
            id: user?.id || '',
            name,
            role,
            username,
            avatarUrl: getAvatarUrl(user?.profileImage),
            initials: initials.toUpperCase(),
            email,
        };
    }, [user]);
}
