import React from 'react';
import { Module } from '../types';

interface AppContextInterface {
  activeModule: Module | 'selection';
  setActiveModule: (module: Module | 'selection') => void;
}

export const AppContext = React.createContext<AppContextInterface | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  activeModule: Module | 'selection';
  setActiveModule: (module: Module | 'selection') => void;
}> = ({ children, activeModule, setActiveModule }) => {
  return (
    <AppContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </AppContext.Provider>
  );
};
