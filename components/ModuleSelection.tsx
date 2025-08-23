import React from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SearchIcon } from './icons/SearchIcon';
import { HeadsetIcon } from './icons/HeadsetIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';


interface ModuleSelectionProps {
    onSelectAccounting: () => void;
    onSelectPartnerCheck: () => void;
    onSelectSecretary: () => void;
    onSelectMarketing: () => void;
}

const ModuleCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-white rounded-lg shadow-lg p-8 w-full text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
        <div className="flex items-center mb-4">
            <div className="bg-primary text-white rounded-full p-3 mr-4">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600">{description}</p>
    </button>
);

const ModuleSelection: React.FC<ModuleSelectionProps> = ({ onSelectAccounting, onSelectPartnerCheck, onSelectSecretary, onSelectMarketing }) => {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-gray-900">Willkommen</h2>
                <p className="mt-4 text-lg text-gray-600">Bitte wählen Sie ein Modul aus, um fortzufahren.</p>
            </div>
            <div className="space-y-8">
                <ModuleCard 
                    title="Buchhaltung & Steuern"
                    description="Automatisieren Sie Ihre Steuererklärungen, verwalten Sie Transaktionen und behalten Sie Ihre Finanzen im Blick."
                    icon={<BookOpenIcon className="h-8 w-8" />}
                    onClick={onSelectAccounting}
                />
                <ModuleCard
                    title="Partnerprüfung"
                    description="Überprüfen Sie neue und bestehende Geschäftspartner auf ihre Gültigkeit und mögliche Risiken aus offenen Quellen."
                    icon={<SearchIcon className="h-8 w-8" />}
                    onClick={onSelectPartnerCheck}
                />
                 <ModuleCard
                    title="Sekretariat & Kommunikation"
                    description="Trainieren Sie einen KI-Assistenten, um Kundenanfragen per E-Mail, Messenger und mehr automatisch zu beantworten."
                    icon={<HeadsetIcon className="h-8 w-8" />}
                    onClick={onSelectSecretary}
                />
                <ModuleCard
                    title="Marketing & Content"
                    description="Erstellen Sie eine Content-Strategie, generieren Sie automatisch Beiträge für Ihre Kanäle und planen Sie Veröffentlichungen."
                    icon={<MegaphoneIcon className="h-8 w-8" />}
                    onClick={onSelectMarketing}
                />
            </div>
        </div>
    );
};

export default ModuleSelection;