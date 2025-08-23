import React from 'react';

type LegalView = 'impressum' | 'agb' | 'datenschutz';

interface FooterProps {
    onShowLegalPage: (page: LegalView) => void;
}

const Footer: React.FC<FooterProps> = ({ onShowLegalPage }) => {
    return (
        <footer className="w-full bg-gray-100 border-t border-gray-200">
            <div className="container mx-auto py-4 px-6 text-center text-gray-500 text-sm">
                <div className="flex justify-center items-center space-x-4 mb-2">
                    <button onClick={() => onShowLegalPage('impressum')} className="hover:text-primary transition-colors">Impressum</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => onShowLegalPage('datenschutz')} className="hover:text-primary transition-colors">Datenschutz</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => onShowLegalPage('agb')} className="hover:text-primary transition-colors">AGB</button>
                </div>
                <p>&copy; {new Date().getFullYear()} Elster KI-Assistent. Alle Rechte vorbehalten.</p>
            </div>
        </footer>
    );
};

export default Footer;
