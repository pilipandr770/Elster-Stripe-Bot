import React, { useContext } from 'react';
import { TaxIcon } from './icons/TaxIcon';
import { AppContext } from '../contexts/AppContext';

interface HeaderProps {
  onBackToHome?: () => void;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onBackToHome, showBackButton = false }) => {
  const { setActiveModule } = useContext(AppContext) || {};

  const handleLogoClick = () => {
    if (onBackToHome) {
      onBackToHome();
    } else if (setActiveModule) {
      setActiveModule('selection');
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <div 
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={handleLogoClick}
          title="Zurück zur Modulauswahl"
        >
          <TaxIcon className="h-8 w-8 text-primary" />
          <h1 className="ml-3 text-2xl font-bold text-gray-800 tracking-tight">
            Elster KI-Assistent
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
