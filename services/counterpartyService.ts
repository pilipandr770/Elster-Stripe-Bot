import { Counterparty } from '../types';

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

export interface CounterpartyCheckResult {
    counterparty_name: string;
    official_name?: string;
    check_date: string;
    overall_status: 'verified' | 'warning' | 'sanctioned' | 'unknown';
    checks: {
        vat_validation: {
            valid: boolean;
            country_code?: string;
            vat_number?: string;
            company_name?: string;
            company_address?: string;
            error?: string;
        };
        sanctions_check: {
            is_sanctioned: boolean;
            matches: Array<{
                entity_name: string;
                list_name: string;
                date_listed: string;
                reasons: string[];
                source_url: string;
            }>;
            match_count: number;
            check_date: string;
        };
        judicial_check: {
            entity_name: string;
            case_count: number;
            cases: Array<{
                case_number: string;
                court: string;
                date_filed: string;
                description: string;
                status: string;
                outcome: string | null;
            }>;
            check_date: string;
        };
    };
}

/**
 * Check a counterparty by name or VAT ID
 * @param name Company name to check
 * @param vatId VAT ID to check
 * @param requesterProfile Optional user profile with information about the requesting entity
 */
export async function checkCounterparty(
    name?: string, 
    vatId?: string,
    requesterProfile?: any
): Promise<CounterpartyCheckResult> {
    // Ensure at least one parameter is provided
    if (!name && !vatId) {
        throw new Error('Either name or vatId must be provided');
    }

    let token: string | null = null;
    try { 
        token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; 
    } catch(_) {}

    const response = await fetch(`${getBackendUrl()}/api/partner_check/check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
            name,
            vat_id: vatId,
            requester_info: requesterProfile ? {
                company_name: requesterProfile.companyName,
                vat_id: requesterProfile.vatId,
                address: requesterProfile.address,
                country: requesterProfile.country
            } : undefined
        })
    });

    if (!response.ok) {
        // Try to get error details
        let errorMessage = 'Failed to check counterparty';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (_) {}
        throw new Error(`HTTP error ${response.status}: ${errorMessage}`);
    }

    return response.json();
}

/**
 * Convert API response to Counterparty object for frontend
 */
export function mapApiResultToCounterparty(result: CounterpartyCheckResult): Counterparty {
    // Extract judicial cases
    const judicialCases = result.checks.judicial_check.cases.map(caseItem => ({
        date: caseItem.date_filed,
        description: caseItem.description,
        status: caseItem.status
    }));

    // Create a counterparty object
    return {
        id: `cp_${Date.now()}`, // Generate a temporary ID
        name: result.official_name || result.counterparty_name,
        vatId: result.checks.vat_validation.country_code && result.checks.vat_validation.vat_number 
            ? `${result.checks.vat_validation.country_code}${result.checks.vat_validation.vat_number}` 
            : 'N/A',
        status: result.overall_status,
        lastCheck: result.check_date,
        judicialCases
    };
}
