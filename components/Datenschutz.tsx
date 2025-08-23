import React from 'react';
import Button from './Button';

interface LegalPageProps {
    onClose: () => void;
}

const Datenschutz: React.FC<LegalPageProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Datenschutzerklärung</h2>
                </div>
                <div className="p-6 overflow-y-auto space-y-4 text-gray-700 prose">
                    <h3>1. Datenschutz auf einen Blick</h3>
                    <p>
                        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                    </p>
                    
                    <h3>2. Datenerfassung auf dieser Website</h3>
                    <p>
                        Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen. Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
                    </p>

                    <h3>3. Welche Daten erheben wir?</h3>
                     <p>
                        Wir erheben und verarbeiten folgende Daten:
                        <ul>
                            <li><strong>Kontodaten:</strong> E-Mail-Adresse und Passwort zur Authentifizierung.</li>
                            <li><strong>Verbindungsdaten:</strong> Ihre Steuer-ID und Stripe API-Schlüssel, um die Automatisierung zu ermöglichen. Diese Daten werden verschlüsselt gespeichert.</li>
                            <li><strong>Transaktionsdaten:</strong> Wir rufen Ihre Transaktionsdaten über die Stripe-API ab, um die Steuererklärungen vorzubereiten. Wir speichern diese Daten nicht dauerhaft, sondern verarbeiten sie zur Laufzeit.</li>
                             <li><strong>Nutzungsdaten:</strong> Anonymisierte Daten über die Interaktion mit unserem Dienst zur Verbesserung der Benutzerfreundlichkeit.</li>
                        </ul>
                    </p>

                    <h3>4. Wofür nutzen wir Ihre Daten?</h3>
                    <p>
                        Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden. Der Hauptzweck der Datenerhebung ist die Erbringung unserer Dienstleistung: die Automatisierung Ihrer Steuererklärung.
                    </p>

                    <h3>5. Welche Rechte haben Sie bezüglich Ihrer Daten?</h3>
                    <p>
                        Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, Sperrung oder Löschung dieser Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.
                    </p>

                     <h3>6. Drittanbieter</h3>
                    <p>
                       <ul>
                            <li><strong>Stripe:</strong> Zur Abwicklung von Transaktionen und Abruf von Finanzdaten. Es gelten die Datenschutzbestimmungen von Stripe.</li>
                            <li><strong>Google Gemini:</strong> Zur Bereitstellung des KI-Assistenten. Anfragen werden zur Verarbeitung an Google gesendet. Es gelten die Datenschutzbestimmungen von Google.</li>
                        </ul>
                    </p>
                     <p className="mt-6 text-sm text-gray-500">
                        <strong>Hinweis:</strong> Dies ist ein vereinfachter Mustertext. Für eine rechtssichere Datenschutzerklärung konsultieren Sie bitte einen Anwalt oder Datenschutzbeauftragten.
                    </p>
                </div>
                <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end">
                    <Button onClick={onClose} variant="secondary">Zurück</Button>
                </div>
            </div>
        </div>
    );
};

export default Datenschutz;
