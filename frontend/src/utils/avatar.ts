/**
 * Centralized Avatar URL Resolution Helper for StrideMate.
 * 
 * Handles all avatar sources consistently across Profile, Navbar, Dashboard, and Onboarding:
 * 1. Local cartoon animal assets: /avatars/fox.svg -> /avatars/fox.svg
 * 2. Backend uploaded avatars: /api/users/avatar/... -> http://<backend-origin>/api/users/avatar/...
 * 3. Full external image URLs: https://... -> https://...
 * 4. Blob URLs from local file picker: blob:http://... -> blob:http://...
 */

export const getApiServerOrigin = (): string => {
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    try {
        if (rawBaseUrl.startsWith('http://') || rawBaseUrl.startsWith('https://')) {
            const url = new URL(rawBaseUrl);
            return url.origin;
        }
    } catch {
        // Fallback for custom or relative paths
    }
    return rawBaseUrl.replace(/\/api\/?$/, '');
};

export const getAvatarUrl = (profilePhoto?: string | null): string | null => {
    if (!profilePhoto || typeof profilePhoto !== 'string') {
        return null;
    }

    const trimmed = profilePhoto.trim();
    if (!trimmed) {
        return null;
    }

    // 1. Temporary blob URL from file picker (for instant preview before save)
    if (trimmed.startsWith('blob:')) {
        return trimmed;
    }

    // 2. Local cartoon animal asset (e.g. /avatars/fox.svg)
    if (trimmed.startsWith('/avatars/')) {
        return trimmed;
    }

    // 3. Full external/absolute URL (e.g. https://... or http://...)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    // 4. Relative backend endpoint path starting with /api/ (e.g. /api/users/avatar/...)
    if (trimmed.startsWith('/api/')) {
        const origin = getApiServerOrigin();
        return `${origin}${trimmed}`;
    }

    // 5. Relative backend endpoint path starting with /users/avatar/ (without /api)
    if (trimmed.startsWith('/users/avatar/')) {
        const origin = getApiServerOrigin();
        return `${origin}/api${trimmed}`;
    }

    return trimmed;
};
