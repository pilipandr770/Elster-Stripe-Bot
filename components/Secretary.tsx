
import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import { SecretaryConfig, SecretaryChannel, KnowledgeBaseFile, SecretaryInstructions } from '../types';
import { MailIcon } from './icons/MailIcon';
import { TelegramIcon } from './icons/TelegramIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { HeadsetIcon } from './icons/HeadsetIcon';
import { InfoIcon } from './icons/InfoIcon';
import { getConfig, saveConfig, uploadKnowledgeFile, testChannelConnection } from '../services/secretaryService';
import { MOCK_SECRETARY_CONFIG } from '../constants'; // Fallback
import GoogleCalendarSettings from './GoogleCalendarSettings';

interface SecretaryProps {
  onBack: () => void;
}

const ChannelIcons = {
    email: <MailIcon className="h-6 w-6 text-gray-600" />,
    telegram: <TelegramIcon className="h-6 w-6 text-blue-500" />,
    whatsapp: <WhatsAppIcon className="h-6 w-6 text-green-500" />,
    signal: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M12.5 7h-1v6h1V7zm0 8h-1v2h1v-2z"/></svg>
};

const Secretary: React.FC<SecretaryProps> = ({ onBack }) => {
  const [config, setConfig] = useState<SecretaryConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedConfig = await getConfig();
        setConfig(fetchedConfig);
      } catch (err) {
        console.error("Failed to fetch secretary config:", err);
        setError("Konfiguration konnte nicht geladen werden. Fallback auf Mock-Daten.");
        setConfig(MOCK_SECRETARY_CONFIG); // Use mock data as a fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = useCallback(async () => {
    if (!config) return;
    try {
      setIsSaving(true);
      setError(null);
      await saveConfig(config);
      // Optionally show a success message
    } catch (err) {
      console.error("Failed to save secretary config:", err);
      setError("Speichern der Konfiguration fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  }, [config]);


  const handleChannelChange = (type: SecretaryChannel['type'], value: string) => {
    if (!config) return;
    setConfig(prev => prev ? {
      ...prev,
      channels: prev.channels.map(ch => ch.type === type ? { ...ch, value } : ch),
    } : null);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && config) {
        const newFiles: KnowledgeBaseFile[] = Array.from(e.dataTransfer.files).map((file: File) => ({
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            size: file.size,
            uploaded: new Date().toISOString(),
            status: 'processing' as const
        }));
        setConfig(prev => prev ? {
            ...prev,
            knowledgeBaseFiles: [...prev.knowledgeBaseFiles, ...newFiles]
        } : null);
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Lade Konfiguration...</div>;
  }

  if (!config) {
    return <div className="text-center p-8 text-red-600">{error || "Konfiguration konnte nicht geladen werden."}</div>;
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Sekretariat & Kommunikation</h2>
        <div className="flex items-center space-x-2">
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Speichern...' : 'Änderungen speichern'}</Button>
            <Button onClick={onBack} variant="secondary">Zurück zur Modulauswahl</Button>
        </div>
      </div>
      
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"><p>{error}</p></div>}

      {/* Main Activation Switch */}
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
        <div>
            <h3 className="font-bold text-lg text-gray-800">KI-Sekretär-Status</h3>
            <p className="text-sm text-gray-500">Aktivieren Sie den Assistenten, um Kundenanfragen automatisch zu bearbeiten.</p>
        </div>
        <div className="flex items-center">
            <span className={`mr-3 font-medium text-sm ${config.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {config.isActive ? 'Aktiv' : 'Inaktiv'}
            </span>
            <button
              type="button"
              className={`${config.isActive ? 'bg-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              role="switch"
              aria-checked={config.isActive}
              onClick={() => setConfig(p => p ? {...p, isActive: !p.isActive} : null)}
            >
              <span
                aria-hidden="true"
                className={`${config.isActive ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Channels, Calendar & Knowledge Base */}
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Kommunikationskanäle</h3>
                 <p className="text-sm text-gray-600 mb-4">Statt eines Tokens für Telegram, wird der Nutzer angewiesen, wie er den zentralen Bot des Dienstes kontaktieren kann.</p>
                <div className="space-y-4">
                    {config.channels.map(channel => (
                        <div key={channel.type}>
                            <label htmlFor={channel.type} className="flex items-center text-sm font-medium text-gray-700 mb-1 capitalize">
                                {ChannelIcons[channel.type]}
                                <span className="ml-2">{channel.type}</span>
                            </label>
                            {channel.type === 'telegram' ? (
                                <div className="p-3 bg-gray-100 rounded-md text-sm text-gray-700">
                                    Um den Telegram-Assistenten zu aktivieren, starten Sie einen Chat mit unserem Bot: <a href="https://t.me/YourElsterBot" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">@YourElsterBot</a>
                                </div>
                            ) : (
                                <input
                                    id={channel.type}
                                    type="text"
                                    value={channel.value}
                                    onChange={e => handleChannelChange(channel.type, e.target.value)}
                                    placeholder={
                                        channel.type === 'email' ? 'z.B. support@ihrefirma.de' :
                                        channel.type === 'whatsapp' ? 'z.B. +491234567890 (Business API)' :
                                        'Signal-Integration (komplex)'
                                    }
                                    disabled={channel.type === 'signal'}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:bg-gray-100"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Google Calendar Settings */}
            <GoogleCalendarSettings 
                initialConfig={config.googleCalendar} 
                onConfigChange={(calendarConfig) => {
                    setConfig(prev => prev ? {
                        ...prev,
                        googleCalendar: calendarConfig
                    } : null);
                }} 
            />

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-lg text-gray-800 mb-2">Wissensdatenbank (Gehirn des Assistenten)</h3>
                <p className="text-sm text-gray-600 mb-4">Laden Sie Dateien hoch (PDFs, DOCs), damit der Assistent genaue Antworten geben kann.</p>
                <div 
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                >
                    <p className="text-gray-500">Dateien hierher ziehen oder klicken zum Auswählen</p>
                </div>
                 <ul className="mt-4 space-y-2">
                    {config.knowledgeBaseFiles.map((file, index) => (
                        <li key={index} className="text-sm text-gray-700 p-2 bg-gray-100 rounded-md flex justify-between items-center">
                            <span>{file.name}</span>
                            <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Right Column: Instructions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-2">Benutzerdefinierte Anweisungen</h3>
            <p className="text-sm text-gray-600 mb-4">Geben Sie dem Assistenten klare Regeln und Informationen. Definieren Sie den Kommunikationsstil, wichtige Fakten (Adresse, Öffnungszeiten) oder spezielle Angebote.</p>
            <textarea
                value={config.instructions?.systemInstruction || ''}
                onChange={e => setConfig(p => p ? { 
                    ...p, 
                    instructions: { 
                        ...p.instructions,
                        systemInstruction: e.target.value 
                    } 
                } : null)}
                rows={18}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm font-mono"
                placeholder="Beispiel: Unser Firmenname ist Muster GmbH. Wir sind von 9-17 Uhr erreichbar..."
            />
        </div>
      </div>
    </div>
  );
};

export default Secretary;