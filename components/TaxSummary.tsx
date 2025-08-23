import React, { useMemo } from 'react';
import { Transaction, Submission } from '../types';

interface TaxSummaryProps {
    transactions: Transaction[];
    submissions: Submission[];
}

const TaxSummary: React.FC<TaxSummaryProps> = ({ transactions, submissions }) => {
    const stats = useMemo(() => {
        // Calculate total income
        const totalIncome = transactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0);
        
        // Calculate total tax collected
        const totalTaxCollected = transactions
            .filter(tx => tx.taxAmount && tx.taxAmount > 0)
            .reduce((sum, tx) => sum + (tx.taxAmount || 0), 0);
        
        // Calculate tax reported (from submitted transactions)
        const submittedTransactionIds = new Set<string>();
        submissions.forEach(sub => {
            sub.transactionIds.forEach(id => submittedTransactionIds.add(id));
        });
        
        const taxReported = transactions
            .filter(tx => tx.taxAmount && tx.taxAmount > 0 && submittedTransactionIds.has(tx.id))
            .reduce((sum, tx) => sum + (tx.taxAmount || 0), 0);
        
        // Calculate tax pending report
        const taxPending = totalTaxCollected - taxReported;
        
        return {
            totalIncome,
            totalTaxCollected,
            taxReported,
            taxPending,
            submissionCount: submissions.length,
            pendingSubmissions: submissions.filter(sub => 
                sub.status !== 'accepted'
            ).length
        };
    }, [transactions, submissions]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Steuerübersicht</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">Gesamteinkommen</p>
                    <p className="text-lg font-bold text-gray-800">
                        {new Intl.NumberFormat('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR' 
                        }).format(stats.totalIncome)}
                    </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">Einreichungen</p>
                    <p className="text-lg font-bold text-gray-800">
                        {stats.submissionCount} 
                        {stats.pendingSubmissions > 0 && 
                            <span className="text-sm font-medium text-amber-600 ml-2">
                                ({stats.pendingSubmissions} ausstehend)
                            </span>
                        }
                    </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">MwSt gemeldet</p>
                    <p className="text-lg font-bold text-green-600">
                        {new Intl.NumberFormat('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR' 
                        }).format(stats.taxReported)}
                    </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">MwSt ausstehend</p>
                    <p className={`text-lg font-bold ${stats.taxPending > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {new Intl.NumberFormat('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR' 
                        }).format(stats.taxPending)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TaxSummary;
