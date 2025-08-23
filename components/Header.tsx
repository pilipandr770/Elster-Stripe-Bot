import React from 'react';
import { TaxIcon } from './icons/TaxIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <TaxIcon className="h-8 w-8 text-primary" />
        <h1 className="ml-3 text-2xl font-bold text-gray-800 tracking-tight">
          Elster KI-Assistent
        </h1>
      </div>
    </header>
  );
};

export default Header;
