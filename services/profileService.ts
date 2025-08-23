import { UserProfile } from '../types';

// Minimal typing / fallback for environments without Vite
declare const importMeta: { env?: { VITE_API_BASE_URL?: string } };

function getBackendUrl(): string {
    // Determine backend URL with fallbacks
    let backendUrl = 'http://localhost:5000';
    try {
        // @ts-ignore
        if ((import.meta as any)?.env?.VITE_API_BASE_URL) {
            // @ts-ignore
            backendUrl = (import.meta as any).env.VITE_API_BASE_URL;
        } else if (importMeta?.env?.VITE_API_BASE_URL) {
            backendUrl = importMeta.env.VITE_API_BASE_URL;
        }
    } catch (_) {
        // ignore fallback remains
    }
    return backendUrl;
}

/**
 * Get the user's profile from the server
 */
export async function getUserProfile(): Promise<UserProfile | null> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 404) {
            // Profile not found is not an error, just return null
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch user profile:", error);
        return null;
    }
}

/**
 * Save the user's profile to the server
 */
export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${getBackendUrl()}/api/profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
    });

    if (!response.ok) {
        let errorMessage = 'Failed to save user profile';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (_) {}
        throw new Error(`HTTP error ${response.status}: ${errorMessage}`);
    }

    return response.json();
}
