
import React, { useState, useMemo } from 'react';
import Button from './Button';
import { MOCK_TRANSACTIONS, MOCK_SUBMISSIONS } from '../constants';
import { Transaction, Submission, SubmissionFrequency } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { CogIcon } from './icons/CogIcon';
import { PiggyBankIcon } from './icons/PiggyBankIcon';
import { TrashIcon } from './icons/TrashIcon';
import DeclarationForm from './DeclarationForm';
import TaxSummary from './TaxSummary';


interface DashboardProps {
  onLogout: () => void;
  onBack: () => void;
}

const AutomationOverview: React.FC<{
  frequency: SubmissionFrequency;
  onFrequencyChange: (freq: SubmissionFrequency) => void;
  taxSetAside: number;
}> = ({ frequency, onFrequencyChange, taxSetAside }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
          <CogIcon className="h-6 w-6 mr-2 text-primary" />
          Automatisierungs-Einstellungen
        </h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Steuerklasse</span>
                <span className="font-bold text-gray-800">Klasse I (Simuliert)</span>
            </div>
            <div className="border-t border-gray-200 pt-4">
                 <label className="font-medium text-gray-600">Einreichungshäufigkeit</label>
                 <fieldset className="mt-2">
                    <legend className="sr-only">Einreichungshäufigkeit</legend>
                    <div className="flex items-center space-x-4">
                       {(['quarterly', 'annually'] as SubmissionFrequency[]).map((option) => (
                           <div key={option} className="flex items-center">
                               <input
                                   id={option}
                                   name="submission-frequency"
                                   type="radio"
                                   checked={frequency === option}
                                   onChange={() => onFrequencyChange(option)}
                                   className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                               />
                               <label htmlFor={option} className="ml-2 block text-sm text-gray-800 capitalize">
                                {option === 'quarterly' ? 'Vierteljährlich' : 'Jährlich'}
                               </label>
                           </div>
                       ))}
                    </div>
                </fieldset>
            </div>
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                 <div className="flex items-center">
                    <PiggyBankIcon className="h-6 w-6 mr-2 text-green-600" />
                    <span className="font-medium text-gray-600">Zurückgelegte Steuern</span>
                 </div>
                 <span className="font-bold text-green-600 text-lg">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(taxSetAside)}
                 </span>
            </div>
        </div>
    </div>
);

const TransactionList: React.FC<{ transactions: Transaction[]; onClaimExpense: (id: string) => void; }> = ({ transactions, onClaimExpense }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Aktuelle Stripe-Aktivitäten</h3>
        <div className="flow-root">
            <ul role="list" className="-my-4 divide-y divide-gray-200">
                {transactions.map(tx => (
                    <li key={tx.id} className="flex items-center py-4 space-x-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                            <div className="flex items-center">
                                <p className="text-sm text-gray-500 truncate">{new Date(tx.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                {tx.taxAmount && (
                                    <>
                                        <span className="mx-2 text-gray-300">|</span>
                                        <p className="text-xs text-orange-600 font-medium">Steuer: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: tx.currency }).format(tx.taxAmount)}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                             <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: tx.currency }).format(tx.amount)}</p>
                             {tx.amount < 0 && !tx.isExpenseClaimed && (
                                 <div className="mt-1">
                                    {tx.isExpenseClaimed ? (
                                        <span className="text-xs font-bold text-blue-600 flex items-center justify-end">
                                            <CheckIcon className="h-4 w-4 mr-1"/> Geltend gemacht
                                        </span>
                                    ) : (
                                        <button onClick={() => onClaimExpense(tx.id)} className="text-xs text-gray-500 hover:text-primary font-semibold">
                                          Als Ausgabe geltend machen
                                        </button>
                                    )}
                                 </div>
                             )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);


const SubmissionLog: React.FC<{ submissions: Submission[] }> = ({ submissions }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Automatisierte ELSTER-Einreichungen</h3>
        <div className="space-y-4">
            {submissions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between">
                     <div>
                        <p className="font-medium text-gray-800">{`Steuereinreichung: ${sub.period}`}</p>
                        <p className="text-sm text-gray-500">{`Eingereicht am: ${new Date(sub.timestamp).toLocaleDateString('de-DE')}`}</p>
                     </div>
                     <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${sub.status === 'accepted' ? 'bg-indigo-100 text-indigo-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {sub.status === 'accepted' ? 'Akzeptiert' : sub.status}
                     </span>
                </div>
            ))}
        </div>
    </div>
);

const AccountSettings: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const handleDeleteAccount = () => {
        if (window.confirm('Sind Sie sicher, dass Sie Ihr Konto endgültig löschen möchten? Alle Ihre Daten werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden.')) {
            console.log("Simulating account deletion...");
            onLogout();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-red-200">
            <h3 className="font-bold text-lg text-gray-800 mb-2">Kontoeinstellungen</h3>
            <p className="text-sm text-gray-600 mb-4">Verwalten Sie Ihre Kontoinformationen und -aktionen.</p>
            <Button onClick={handleDeleteAccount} className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 w-full sm:w-auto">
                <TrashIcon className="h-5 w-5 mr-2" />
                Konto löschen
            </Button>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ onLogout, onBack }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [frequency, setFrequency] = useState<SubmissionFrequency>('quarterly');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeclarationForm, setShowDeclarationForm] = useState<boolean>(false);
  
  // Load data on mount
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Import services dynamically to avoid issues with SSR
        const { getStripeTransactions } = await import('../services/stripeService');
        const { getSubmissions, getSubmissionFrequency } = await import('../services/elsterService');
        
        // Fetch data in parallel
        const [transactionsData, submissionsData, frequencyData] = await Promise.all([
          getStripeTransactions(),
          getSubmissions(),
          getSubmissionFrequency()
        ]);
        
        setTransactions(transactionsData);
        setSubmissions(submissionsData);
        setFrequency(frequencyData.frequency);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data');
        // Keep the mock data if there's an error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleClaimExpense = async (transactionId: string) => {
    try {
      const { markTransactionAsExpense } = await import('../services/stripeService');
      const updatedTransaction = await markTransactionAsExpense(transactionId);
      
      setTransactions(prev => 
          prev.map(tx => 
              tx.id === transactionId ? { ...tx, isExpenseClaimed: true } : tx
          )
      );
    } catch (error) {
      console.error('Error marking transaction as expense:', error);
      alert('Failed to mark transaction as expense');
    }
  };
  
  const handleFrequencyChange = async (newFrequency: SubmissionFrequency) => {
    try {
      const { setSubmissionFrequency } = await import('../services/elsterService');
      // Ensure we only pass 'quarterly' or 'annually', not 'immediate'
      if (newFrequency === 'quarterly' || newFrequency === 'annually') {
        await setSubmissionFrequency(newFrequency);
        setFrequency(newFrequency);
      }
    } catch (error) {
      console.error('Error updating submission frequency:', error);
      alert('Failed to update submission frequency');
    }
  };
  
  const handleCreateDeclaration = () => {
    setShowDeclarationForm(true);
  };
  
  const handleSubmitDeclaration = async (period: string, transactionIds: string[]) => {
    try {
      const { submitTaxDeclaration } = await import('../services/elsterService');
      await submitTaxDeclaration(period, transactionIds);
      
      // Create a temporary submission while we wait for backend processing
      const newSubmission: Submission = {
        id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        period,
        status: 'submitted',
        transactionIds
      };
      
      setSubmissions(prev => [newSubmission, ...prev]);
      setShowDeclarationForm(false);
    } catch (error) {
      console.error('Error submitting declaration:', error);
      alert('Failed to submit tax declaration');
    }
  };
  
  const totalTaxSetAside = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + (tx.taxAmount || 0), 0);
  }, [transactions]);

  return (
    <div className="animate-fade-in space-y-8">
        <div className="flex justify-between items-center">
             <h2 className="text-3xl font-bold text-gray-900">Automations-Dashboard</h2>
             <div className="flex items-center space-x-2">
                <Button onClick={onBack} variant="secondary">Zurück zur Modulauswahl</Button>
                <Button onClick={onLogout} variant="secondary">Abmelden</Button>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
                {isLoading ? (
                    <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                        <span className="ml-3">Daten werden geladen...</span>
                    </div>
                ) : error ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-red-700">
                        {error}
                    </div>
                ) : (
                    <>
                        <AutomationOverview 
                            frequency={frequency}
                            onFrequencyChange={handleFrequencyChange}
                            taxSetAside={totalTaxSetAside}
                        />
                        <SubmissionLog submissions={submissions} />
                    </>
                )}
                 <AccountSettings onLogout={onLogout} />
            </div>
            <div className="lg:col-span-2">
                {showDeclarationForm ? (
                    <DeclarationForm
                        transactions={transactions}
                        submissions={submissions}
                        onSubmit={handleSubmitDeclaration}
                        onCancel={() => setShowDeclarationForm(false)}
                    />
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">Stripe-Transaktionen und Steuer</h3>
                            <Button onClick={handleCreateDeclaration} variant="primary">
                                Neue Steuererklärung
                            </Button>
                        </div>
                        <TaxSummary 
                            transactions={transactions} 
                            submissions={submissions} 
                        />
                        <TransactionList transactions={transactions} onClaimExpense={handleClaimExpense} />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;