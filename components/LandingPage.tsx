
import React from 'react';
import { TaxIcon } from './icons/TaxIcon';
import { ClockIcon } from './icons/ClockIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import Button from './Button';
import Footer from './Footer';

type LegalView = 'impressum' | 'agb' | 'datenschutz';

interface LandingPageProps {
    onShowLogin: () => void;
    onShowRegister: () => void;
    onShowLegalPage: (page: LegalView) => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center">
        <div className="bg-indigo-100 text-primary rounded-full p-3 mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{children}</p>
    </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onShowLogin, onShowRegister, onShowLegalPage }) => {
    return (
        <div className="bg-light font-sans text-gray-800">
            {/* Header */}
            <header className="py-4 px-6 sm:px-12">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <TaxIcon className="h-8 w-8 text-primary" />
                        <h1 className="ml-3 text-2xl font-bold text-gray-800 tracking-tight">
                          Elster KI-Assistent
                        </h1>
                    </div>
                    <nav>
                        <Button onClick={onShowLogin} variant="secondary">Anmelden</Button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main>
                <section className="text-center py-20 px-6 bg-white">
                    <div className="container mx-auto">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-dark tracking-tight">
                            Automatisieren Sie Ihre Steuern.
                            <br />
                            <span className="text-primary">Sparen Sie Ihre Zeit.</span>
                        </h2>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
                            Verbinden Sie Ihr Stripe-Konto und lassen Sie unseren KI-Assistenten die Steuererklärung für ELSTER automatisch vorbereiten und einreichen. Sicher, schnell und fehlerfrei.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <Button onClick={onShowRegister} className="px-8 py-3 text-lg">Kostenlos starten</Button>
                        </div>
                    </div>
                </section>
                
                {/* How it works */}
                <section id="features" className="py-20 px-6">
                    <div className="container mx-auto text-center">
                         <h3 className="text-3xl font-bold text-dark mb-4">So einfach funktioniert's</h3>
                         <p className="text-gray-600 mb-12 max-w-2xl mx-auto">In nur drei Schritten zur vollständig automatisierten Steuererklärung.</p>
                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="text-center">
                               <div className="flex items-center justify-center mx-auto h-16 w-16 rounded-full bg-primary text-white font-bold text-2xl mb-4">1</div>
                               <h4 className="text-xl font-semibold mb-2">Konten verbinden</h4>
                               <p className="text-gray-600">Verknüpfen Sie sicher Ihr Stripe-Konto und geben Sie Ihre ELSTER-Daten an.</p>
                            </div>
                            <div className="text-center">
                               <div className="flex items-center justify-center mx-auto h-16 w-16 rounded-full bg-primary text-white font-bold text-2xl mb-4">2</div>
                               <h4 className="text-xl font-semibold mb-2">Automatisierung läuft</h4>
                               <p className="text-gray-600">Unser System erfasst neue Transaktionen, berechnet Steuern und bereitet die Meldungen vor.</p>
                            </div>
                            <div className="text-center">
                               <div className="flex items-center justify-center mx-auto h-16 w-16 rounded-full bg-primary text-white font-bold text-2xl mb-4">3</div>
                               <h4 className="text-xl font-semibold mb-2">Überwachen & Einreichen</h4>
                               <p className="text-gray-600">Behalten Sie im Dashboard den Überblick und lassen Sie die Einreichungen automatisch durchführen.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-20 px-6 bg-white">
                     <div className="container mx-auto text-center">
                         <h3 className="text-3xl font-bold text-dark mb-4">Ihre Vorteile im Überblick</h3>
                         <p className="text-gray-600 mb-12 max-w-2xl mx-auto">Konzentrieren Sie sich auf Ihr Geschäft, wir kümmern uns um die Bürokratie.</p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                             <FeatureCard icon={<ClockIcon className="h-8 w-8" />} title="Zeitersparnis">
                                Schluss mit manueller Dateneingabe. Sparen Sie Stunden wertvoller Zeit jeden Monat.
                            </FeatureCard>
                             <FeatureCard icon={<SparklesIcon className="h-8 w-8" />} title="Fehlervermeidung">
                                Unsere Automatisierung minimiert menschliche Fehler und sorgt für korrekte Einreichungen.
                            </FeatureCard>
                             <FeatureCard icon={<ChartBarIcon className="h-8 w-8" />} title="Voller Überblick">
                                Behalten Sie stets die Kontrolle über Ihre Finanzen mit einem klaren und intuitiven Dashboard.
                            </FeatureCard>
                             <FeatureCard icon={<ShieldIcon className="h-8 w-8" />} title="Sicherheit">
                                Ihre Daten werden verschlüsselt und nach höchsten Sicherheitsstandards behandelt.
                            </FeatureCard>
                        </div>
                    </div>
                </section>
            </main>

            <Footer onShowLegalPage={onShowLegalPage} />
        </div>
    );
};

export default LandingPage;