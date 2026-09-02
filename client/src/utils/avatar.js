export const DEFAULT_AVATAR_URL = 'https://ik.imagekit.io/2bzzjhgkg/defaul_profile_image.jpeg';

/**
 * Resolves a given URL to a valid avatar image, falling back to the DB's default if empty.
 * @param {string|null} url
 * @returns {string}
 */
export function getAvatarUrl(url) {
    if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null') {
        return DEFAULT_AVATAR_URL;
    }
    return url;
}
