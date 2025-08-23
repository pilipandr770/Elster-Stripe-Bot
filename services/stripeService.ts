import { Transaction } from '../types';

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
 * Get transactions from Stripe for a specific period
 * @param startDate Start date in ISO format (YYYY-MM-DD)
 * @param endDate End date in ISO format (YYYY-MM-DD)
 * @returns Array of transactions
 */
export async function getStripeTransactions(startDate?: string, endDate?: string): Promise<Transaction[]> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
        const response = await fetch(`${getBackendUrl()}/api/stripe/transactions${queryString}`, {
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
        console.error("Failed to fetch Stripe transactions:", error);
        throw error;
    }
}

/**
 * Mark a transaction as an expense claim
 * @param transactionId The ID of the transaction to mark as an expense claim
 * @returns The updated transaction
 */
export async function markTransactionAsExpense(transactionId: string): Promise<Transaction> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/stripe/transactions/${transactionId}/claim-expense`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to mark transaction as expense:", error);
        throw error;
    }
}

/**
 * Connect a user's Stripe account using their API key
 * @param stripeApiKey The user's Stripe API key
 * @returns Success message
 */
export async function connectStripeAccount(stripeApiKey: string): Promise<{ message: string }> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/stripe/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                api_key: stripeApiKey
            })
        });

        if (!response.ok) {
            let errorMessage = 'Failed to connect Stripe account';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (_) {}
            throw new Error(`HTTP error ${response.status}: ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to connect Stripe account:", error);
        throw error;
    }
}

/**
 * Verify if a Stripe account is connected
 * @returns Whether the account is connected
 */
export async function isStripeConnected(): Promise<{ connected: boolean }> {
    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    if (!token) {
        return { connected: false };
    }

    try {
        const response = await fetch(`${getBackendUrl()}/api/stripe/status`, {
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
        console.error("Failed to check Stripe connection status:", error);
        return { connected: false };
    }
}
