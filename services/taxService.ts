import { useState, useEffect } from 'react';
import { Transaction, Submission } from '../types';

// Function to calculate the quarterly periods based on transactions
export function calculatePeriods(transactions: Transaction[]): string[] {
    if (!transactions.length) return [];
    
    // Get unique years and quarters from transaction dates
    const periods = new Set<string>();
    
    transactions.forEach(tx => {
        const date = new Date(tx.date);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periods.add(`Q${quarter} ${year}`);
    });
    
    // Convert to array and sort by most recent first
    return Array.from(periods).sort((a, b) => {
        const [q1, y1] = a.split(' ');
        const [q2, y2] = b.split(' ');
        
        if (y1 !== y2) return parseInt(y2) - parseInt(y1);
        return parseInt(q2.substring(1)) - parseInt(q1.substring(1));
    });
}

// Function to filter transactions by period
export function filterTransactionsByPeriod(
    transactions: Transaction[],
    period: string
): Transaction[] {
    // Parse period (e.g., "Q2 2024")
    const [quarterStr, yearStr] = period.split(' ');
    const quarter = parseInt(quarterStr.substring(1));
    const year = parseInt(yearStr);
    
    // Calculate start and end dates for the quarter
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);
    
    // Filter transactions that fall within this period
    return transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
    });
}

// Check if a period has already been submitted
export function isPeriodSubmitted(
    submissions: Submission[],
    period: string
): boolean {
    return submissions.some(sub => sub.period === period);
}

// Function to get transactions that are not part of any submission
export function getUnsubmittedTransactions(
    transactions: Transaction[],
    submissions: Submission[]
): Transaction[] {
    // Get all transaction IDs that are part of submissions
    const submittedIds = new Set<string>();
    submissions.forEach(sub => {
        sub.transactionIds.forEach(id => submittedIds.add(id));
    });
    
    // Filter transactions that are not in any submission
    return transactions.filter(tx => !submittedIds.has(tx.id));
}
