import React, { useState, useMemo } from 'react';
import { Transaction, Submission } from '../types';
import Button from './Button';
import { 
    calculatePeriods, 
    filterTransactionsByPeriod, 
    isPeriodSubmitted,
    getUnsubmittedTransactions
} from '../services/taxService';

interface DeclarationFormProps {
    transactions: Transaction[];
    submissions: Submission[];
    onSubmit: (period: string, transactionIds: string[]) => void;
    onCancel: () => void;
}

const DeclarationForm: React.FC<DeclarationFormProps> = ({ 
    transactions, 
    submissions,
    onSubmit, 
    onCancel 
}) => {
    const availablePeriods = useMemo(() => {
        // Get all possible periods from transactions
        const unsubmittedTxs = getUnsubmittedTransactions(transactions, submissions);
        const periods = calculatePeriods(unsubmittedTxs);
        
        // Filter out periods that have already been submitted
        return periods.filter(period => !isPeriodSubmitted(submissions, period));
    }, [transactions, submissions]);
    
    const [selectedPeriod, setSelectedPeriod] = useState<string>(availablePeriods[0] || '');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    
    const periodTransactions = useMemo(() => {
        if (!selectedPeriod) return [];
        return filterTransactionsByPeriod(transactions, selectedPeriod);
    }, [selectedPeriod, transactions]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPeriod || periodTransactions.length === 0) return;
        
        setIsSubmitting(true);
        
        try {
            const txIds = periodTransactions.map(tx => tx.id);
            onSubmit(selectedPeriod, txIds);
        } catch (error) {
            console.error('Error submitting declaration:', error);
            setIsSubmitting(false);
        }
    };
    
    if (availablePeriods.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-700 mb-4">
                    Keine neuen Zeiträume für die Steuererklärung verfügbar.
                </p>
                <Button onClick={onCancel} variant="secondary">
                    Zurück
                </Button>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Neue ELSTER-Einreichung erstellen</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zeitraum auswählen
                    </label>
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        required
                    >
                        <option value="" disabled>Zeitraum wählen</option>
                        {availablePeriods.map(period => (
                            <option key={period} value={period}>
                                {period}
                            </option>
                        ))}
                    </select>
                </div>
                
                {selectedPeriod && (
                    <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                            Einzureichende Transaktionen ({periodTransactions.length})
                        </h4>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                            {periodTransactions.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">
                                    Keine Transaktionen für diesen Zeitraum gefunden.
                                </p>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {periodTransactions.map(tx => (
                                        <li key={tx.id} className="py-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{tx.description}</span>
                                                <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {new Intl.NumberFormat('de-DE', { 
                                                        style: 'currency', 
                                                        currency: tx.currency 
                                                    }).format(tx.amount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>{new Date(tx.date).toLocaleDateString('de-DE')}</span>
                                                {tx.taxAmount !== undefined && (
                                                    <span>
                                                        MwSt: {new Intl.NumberFormat('de-DE', { 
                                                            style: 'currency', 
                                                            currency: tx.currency 
                                                        }).format(tx.taxAmount)}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
                
                <div className="flex justify-between pt-4 border-t border-gray-200">
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Abbrechen
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={!selectedPeriod || periodTransactions.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Wird eingereicht...' : 'An ELSTER einreichen'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default DeclarationForm;
