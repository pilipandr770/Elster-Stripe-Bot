import React from 'react';
import Button from './Button';

interface LegalPageProps {
    onClose: () => void;
}

const AGB: React.FC<LegalPageProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Allgemeine Geschäftsbedingungen (AGB)</h2>
                </div>
                <div className="p-6 overflow-y-auto space-y-4 text-gray-700 prose">
                    <h3>1. Geltungsbereich</h3>
                    <p>
                        Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen [Ihr Firmenname] (nachfolgend "Anbieter") und seinen Kunden (nachfolgend "Nutzer") über die Nutzung des Dienstes "Elster KI-Assistent".
                    </p>

                    <h3>2. Vertragsgegenstand</h3>
                    <p>
                        Der Anbieter stellt eine Software-as-a-Service (SaaS) Lösung zur Verfügung, die es dem Nutzer ermöglicht, seine über Stripe abgewickelten Einnahmen automatisiert für die Steuererklärung an das deutsche Finanzamt (ELSTER) vorzubereiten und zu übermitteln.
                    </p>

                    <h3>3. Leistungen des Anbieters</h3>
                    <p>
                        Der Anbieter gewährleistet die technische Verfügbarkeit des Dienstes im Rahmen des üblichen. Der Anbieter ist nicht für die Richtigkeit der vom Nutzer eingegebenen Daten oder der von Stripe übermittelten Transaktionen verantwortlich. Der Dienst stellt keine Steuerberatung dar.
                    </p>
                    
                    <h3>4. Pflichten des Nutzers</h3>
                    <p>
                        Der Nutzer ist für die Korrektheit seiner eingegebenen Daten (insb. Steuer-ID und Stripe API-Schlüssel) allein verantwortlich. Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und vor dem Zugriff Dritter zu schützen.
                    </p>

                    <h3>5. Haftung</h3>
                    <p>
                       Der Anbieter haftet nicht für steuerliche Nachteile oder fehlerhafte Übermittlungen, die auf falschen Eingaben des Nutzers oder fehlerhaften Daten von Drittanbietern (z.B. Stripe) beruhen. Die Haftung des Anbieters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt.
                    </p>

                    <h3>6. Kündigung</h3>
                    <p>
                        Der Vertrag kann von beiden Seiten gemäß den vereinbarten Kündigungsfristen des gewählten Abonnement-Modells gekündigt werden. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
                    </p>
                    <p className="mt-6 text-sm text-gray-500">
                        <strong>Hinweis:</strong> Dies ist ein vereinfachter Mustertext. Für rechtssichere AGB konsultieren Sie bitte einen Anwalt.
                    </p>
                </div>
                <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end">
                    <Button onClick={onClose} variant="secondary">Zurück</Button>
                </div>
            </div>
        </div>
    );
};

export default AGB;
