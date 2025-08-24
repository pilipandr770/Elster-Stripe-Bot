import React, { useState, useCallback, useEffect } from 'react';
import Button from './Button';
import Input from './Input';
import { MOCK_USER_PROFILE, MOCK_COUNTERPARTIES } from '../constants';
import { UserProfile, Counterparty } from '../types';

interface PartnerCheckProps {
  onBack: () => void;
}

const getStatusBadge = (status: Counterparty['status']) => {
    switch (status) {
        case 'verified': return 'bg-green-100 text-green-800';
        case 'warning': return 'bg-yellow-100 text-yellow-800';
        case 'sanctioned': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const PartnerCheck: React.FC<PartnerCheckProps> = ({ onBack }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<Counterparty | null>(null);
  const [history, setHistory] = useState<Counterparty[]>(MOCK_COUNTERPARTIES);

  const handleProfileSave = (profileData: UserProfile) => {
    // In a real app, this would be an API call
    setUserProfile(profileData);
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsChecking(true);
    setCheckResult(null);

    try {
        // Determine if the search query is a VAT ID or company name
        const isVatId = /^[A-Z]{2}[0-9A-Z]{7,12}$/i.test(searchQuery);
        
        // Get latest profile data if available
        let currentProfile = userProfile;
        if (!currentProfile) {
            try {
                const { getUserProfile } = await import('../services/profileService');
                currentProfile = await getUserProfile();
            } catch (err) {
                console.error("Failed to get user profile:", err);
                // Continue with check even if profile can't be loaded
            }
        }
        
        // Import the service dynamically to avoid issues with SSR
        const { checkCounterparty, mapApiResultToCounterparty } = await import('../services/counterpartyService');
        
        // Call the real API with profile information if available
        const result = await checkCounterparty(
            isVatId ? undefined : searchQuery,  // name
            isVatId ? searchQuery : undefined,   // vatId
            currentProfile  // Pass profile for requester information
        );
        
        // Convert API result to Counterparty object
        const counterparty = mapApiResultToCounterparty(result);
        
        // Update state with result
        setCheckResult(counterparty);
        
        // Add to history if not already there
        setHistory(prev => {
            const exists = prev.some(item => 
                item.name.toLowerCase() === counterparty.name.toLowerCase() || 
                (item.vatId !== 'N/A' && item.vatId === counterparty.vatId)
            );
            return exists ? prev : [counterparty, ...prev];
        });
    } catch (error) {
        console.error("Error checking counterparty:", error);
        // Show error as a result
        setCheckResult({
            id: `error_${Date.now()}`,
            name: searchQuery,
            vatId: 'N/A',
            status: 'unknown',
            lastCheck: new Date().toISOString(),
            judicialCases: [{
                date: new Date().toISOString(),
                description: `Fehler bei der Überprüfung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
                status: 'Error'
            }]
        });
    } finally {
        setIsChecking(false);
    }
  };
  
  if (!userProfile) {
    return <UserProfileForm onSave={handleProfileSave} onBack={onBack} />;
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Partnerprüfung (Due Diligence)</h2>
        <Button onClick={onBack} variant="secondary">Zurück zur Modulauswahl</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Search & Results */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Partner überprüfen</h3>
                <form onSubmit={handleCheck} className="flex items-center space-x-2">
                    <Input
                        id="searchQuery"
                        label="Firmenname oder USt-IdNr."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="z.B. Tech Solutions AG"
                    />
                    <div className="pt-5">
                        <Button type="submit" disabled={isChecking || !searchQuery}>
                            {isChecking ? 'Überprüfe...' : 'Prüfen'}
                        </Button>
                    </div>
                </form>
            </div>
            {checkResult && <CheckResultDisplay result={checkResult} />}
        </div>
        
        {/* Right Column: History */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Prüfverlauf</h3>
            <ul className="space-y-4">
                {history.map(item => (
                    <li key={item.id} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${getStatusBadge(item.status)}`}>{item.status}</span>
                        </div>
                        <p className="text-sm text-gray-500">Letzte Prüfung: {new Date(item.lastCheck).toLocaleDateString('de-DE')}</p>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};


const UserProfileForm: React.FC<{ onSave: (profile: UserProfile) => void, onBack: () => void }> = ({ onSave, onBack }) => {
    const [profile, setProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Load user profile on mount
    useEffect(() => {
        async function loadProfile() {
            try {
                setIsLoading(true);
                setError(null);
                const { getUserProfile } = await import('../services/profileService');
                const userProfile = await getUserProfile();
                if (userProfile) {
                    setProfile(userProfile);
                }
            } catch (err) {
                console.error("Error loading profile:", err);
                setError("Fehler beim Laden des Profils. Bitte versuchen Sie es später erneut.");
            } finally {
                setIsLoading(false);
            }
        }
        
        loadProfile();
    }, []);

    const handleChange = (field: keyof UserProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
        // Clear any previous errors when user makes changes
        setError(null);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        
        try {
            const { saveUserProfile } = await import('../services/profileService');
            const savedProfile = await saveUserProfile(profile);
            onSave(savedProfile);
        } catch (err) {
            console.error("Error saving profile:", err);
            setError("Fehler beim Speichern des Profils. Bitte versuchen Sie es später erneut.");
            setIsSaving(false);
        }
    };

    return (
         <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                 <h2 className="text-3xl font-bold text-gray-900">Ihr Firmenprofil</h2>
                 <Button onClick={onBack} variant="secondary" disabled={isSaving}>Zurück</Button>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-xl animate-fade-in">
              <p className="text-sm text-gray-600 mb-6">
                Bitte vervollständigen Sie Ihr Firmenprofil. Diese Daten werden genutzt, um detailliertere Informationen bei der Partnerprüfung aus öffentlichen Quellen zu erhalten.
              </p>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3">Profil wird geladen...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" role="form">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            <p>{error}</p>
                        </div>
                    )}
                    
                    <Input id="companyName" label="Offizieller Firmenname" type="text" value={profile.companyName} onChange={e => handleChange('companyName', e.target.value)} />
                    <Input id="vatId" label="Umsatzsteuer-Identifikationsnummer (USt-IdNr.)" type="text" value={profile.vatId} onChange={e => handleChange('vatId', e.target.value)} />
                    <Input id="address" label="Anschrift" type="text" value={profile.address} onChange={e => handleChange('address', e.target.value)} />
                    <Input id="country" label="Land" type="text" value={profile.country} onChange={e => handleChange('country', e.target.value)} />
                    <div className="pt-4">
                         <Button 
                             type="submit" 
                             className="w-full" 
                             disabled={isSaving}
                             data-testid="save-profile-button"
                         >
                             {isSaving ? "Profil wird gespeichert..." : "Profil speichern & weiter"}
                         </Button>
                    </div>
                </form>
              )}
            </div>
         </div>
    );
};

const CheckResultDisplay: React.FC<{ result: Counterparty }> = ({ result }) => {
    // Helper function to get appropriate icon based on status
    const getStatusIcon = (status: Counterparty['status']) => {
        switch (status) {
            case 'verified': return '✅';
            case 'warning': return '⚠️';
            case 'sanctioned': return '❌';
            default: return 'ℹ️';
        }
    };

    // Helper function to get a human-readable status
    const getStatusText = (status: Counterparty['status']) => {
        switch (status) {
            case 'verified': return 'Verifiziert';
            case 'warning': return 'Warnung';
            case 'sanctioned': return 'Sanktioniert';
            default: return 'Unbekannt';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Ergebnis der Überprüfung</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-xl text-gray-900">{result.name}</p>
                        <p className="text-sm text-gray-500">USt-IdNr.: {result.vatId}</p>
                    </div>
                    <span className={`text-sm font-bold uppercase px-3 py-1.5 rounded-full ${getStatusBadge(result.status)}`}>
                        {getStatusIcon(result.status)} {getStatusText(result.status)}
                    </span>
                </div>

                {/* Status summary */}
                <div className="p-3 rounded-md border" 
                    style={{
                        borderColor: result.status === 'verified' ? '#d1fae5' : 
                                    result.status === 'warning' ? '#fef3c7' : 
                                    result.status === 'sanctioned' ? '#fee2e2' : 
                                    '#e5e7eb'
                    }}>
                    {result.status === 'verified' && (
                        <p className="text-green-800">Dieses Unternehmen wurde überprüft und scheint legitim zu sein.</p>
                    )}
                    {result.status === 'warning' && (
                        <p className="text-yellow-800">Bei diesem Unternehmen wurden potenzielle Risikofaktoren identifiziert. Bitte prüfen Sie die Details unten.</p>
                    )}
                    {result.status === 'sanctioned' && (
                        <p className="text-red-800">WARNUNG: Dieses Unternehmen ist in Sanktionslisten aufgeführt. Geschäftsbeziehungen können rechtliche Konsequenzen haben.</p>
                    )}
                    {result.status === 'unknown' && (
                        <p className="text-gray-800">Für dieses Unternehmen liegen nur begrenzte Informationen vor. Eine manuelle Überprüfung wird empfohlen.</p>
                    )}
                </div>

                {/* Legal cases section */}
                <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Bekannte Gerichtsverfahren</h4>
                    {result.judicialCases.length > 0 ? (
                        <ul className="space-y-2">
                           {result.judicialCases.map((c, i) => (
                               <li key={i} className="text-sm p-2 bg-gray-50 rounded">
                                   <p className="font-medium text-gray-800">{c.description}</p>
                                   <div className="flex justify-between items-center mt-1">
                                       <p className="text-xs text-gray-500">Datum: {new Date(c.date).toLocaleDateString('de-DE')}</p>
                                       <span className={`text-xs px-2 py-1 rounded ${
                                           c.status.toLowerCase().includes('abgeschlossen') ? 'bg-blue-100 text-blue-800' : 
                                           c.status.toLowerCase().includes('error') ? 'bg-red-100 text-red-800' :
                                           'bg-yellow-100 text-yellow-800'
                                       }`}>
                                           {c.status}
                                       </span>
                                   </div>
                               </li>
                           ))}
                        </ul>
                    ) : (
                       <p className="text-sm text-gray-500">Keine offenen oder relevanten abgeschlossenen Verfahren in den überprüften Quellen gefunden.</p>
                    )}
                </div>
                
                {/* Source information */}
                <p className="text-xs text-gray-400 pt-4 border-t">
                    Letzte Prüfung am {new Date(result.lastCheck).toLocaleString('de-DE')}. 
                    Diese Prüfung umfasst USt-IdNr.-Validierung, Sanktionslisten und öffentliche Gerichtsverfahren.
                    Nicht alle potentiellen Risiken können erfasst werden.
                </p>
            </div>
        </div>
    );
};

export default PartnerCheck;