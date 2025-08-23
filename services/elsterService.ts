import { Submission, TaxFormData } from '../types';

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
 * Get all tax submissions
 * @returns Array of submissions
 */
export async function getSubmissions(): Promise<Submission[]> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/elster/submissions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch submissions:", error);
        throw error;
    }
}

/**
 * Get a specific submission by ID
 * @param submissionId The ID of the submission to retrieve
 * @returns The submission
 */
export async function getSubmission(submissionId: string): Promise<Submission> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/elster/submissions/${submissionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch submission ${submissionId}:`, error);
        throw error;
    }
}

/**
 * Submit a tax declaration to ELSTER
 * @param period The period for the submission (e.g., 'Q2 2024')
 * @param transactionIds Array of transaction IDs to include in the submission
 * @returns The created submission
 */
export async function submitTaxDeclaration(
    period: string, 
    transactionIds: string[]
): Promise<Submission> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/elster/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                period,
                transaction_ids: transactionIds
            })
        });

        if (!response.ok) {
            let errorMessage = 'Failed to submit tax declaration';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (_) {}
            throw new Error(`HTTP error ${response.status}: ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to submit tax declaration:", error);
        throw error;
    }
}

/**
 * Connect user's ELSTER account using their tax ID
 * @param taxId The user's tax ID
 * @param taxFormData Additional tax form data
 * @returns Success message
 */
export async function connectElsterAccount(
    taxId: string,
    taxFormData?: TaxFormData
): Promise<{ message: string }> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/elster/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                tax_id: taxId,
                form_data: taxFormData
            })
        });

        if (!response.ok) {
            let errorMessage = 'Failed to connect ELSTER account';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (_) {}
            throw new Error(`HTTP error ${response.status}: ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to connect ELSTER account:", error);
        throw error;
    }
}

/**
 * Check if the user has a connected ELSTER account
 * @returns Whether the account is connected
 */
export async function isElsterConnected(): Promise<{ connected: boolean }> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        return { connected: false };
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/elster/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return { connected: false };
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to check ELSTER connection status:", error);
        return { connected: false };
    }
}

/**
 * Get the user's submission frequency setting
 * @returns The submission frequency ('quarterly' or 'annually')
 */
export async function getSubmissionFrequency(): Promise<{ frequency: 'quarterly' | 'annually' }> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/elster/frequency`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch submission frequency:", error);
        throw error;
    }
}

/**
 * Update the user's submission frequency setting
 * @param frequency The submission frequency ('quarterly' or 'annually')
 * @returns Success message
 */
export async function setSubmissionFrequency(frequency: 'quarterly' | 'annually'): Promise<{ message: string }> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/elster/frequency`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ frequency })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to update submission frequency:", error);
        throw error;
    }
}
