import React from 'react';
import Button from './Button';

interface LegalPageProps {
    onClose: () => void;
}

const Impressum: React.FC<LegalPageProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Impressum</h2>
                </div>
                <div className="p-6 overflow-y-auto space-y-4 text-gray-700">
                    <p className="font-semibold">Angaben gemäß § 5 TMG:</p>
                    <p>
                        [Ihr Name/Firmenname]<br />
                        [Ihre Straße und Hausnummer]<br />
                        [Ihre PLZ und Stadt]<br />
                        [Ihr Land]
                    </p>
                    <p className="font-semibold">Kontakt:</p>
                    <p>
                        Telefon: [Ihre Telefonnummer]<br />
                        E-Mail: [Ihre E-Mail-Adresse]
                    </p>
                    <p className="font-semibold">Umsatzsteuer-ID:</p>
                    <p>
                        Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
                        [Ihre USt-IdNr.]
                    </p>
                    <p className="font-semibold">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</p>
                    <p>
                        [Ihr Name]<br />
                        [Ihre Anschrift]
                    </p>
                     <p className="mt-6 text-sm text-gray-500">
                        <strong>Haftungsausschluss:</strong> Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
                    </p>
                </div>
                 <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end">
                    <Button onClick={onClose} variant="secondary">Zurück</Button>
                </div>
            </div>
        </div>
    );
};

export default Impressum;
