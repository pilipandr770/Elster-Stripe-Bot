import React, { useState, useCallback } from 'react';
import Dashboard from './Dashboard';
import Settings from './Settings';
import ModuleSelection from './ModuleSelection';
import PartnerCheck from './PartnerCheck';
import Secretary from './Secretary';
import Marketing from './Marketing';
import { Module } from '../types';

interface UserViewProps {
  onLogout: () => void;
  activeModule: Module | 'selection';
  setActiveModule: (module: Module | 'selection') => void;
}

const UserView: React.FC<UserViewProps> = ({ onLogout, activeModule, setActiveModule }) => {
  // The logic for accounting connection state remains local to this view
  const [isAccountingConnected, setIsAccountingConnected] = useState(false);
  const handleConnectAccounting = useCallback((stripeKey: string, taxId: string) => {
    if (stripeKey && taxId) {
      setIsAccountingConnected(true);
    }
  }, []);

  const handleBackToSelection = () => setActiveModule('selection');

  switch (activeModule) {
    case 'accounting':
      return isAccountingConnected ? (
        <Dashboard onLogout={onLogout} onBack={handleBackToSelection} />
      ) : (
        <Settings onConnect={handleConnectAccounting} />
      );
    case 'partnerCheck':
      return <PartnerCheck onBack={handleBackToSelection} />;
    case 'secretary':
      return <Secretary onBack={handleBackToSelection} />;
    case 'marketing':
      return <Marketing onBack={handleBackToSelection} />;
    case 'selection':
    default:
      return <ModuleSelection 
               onSelectAccounting={() => setActiveModule('accounting')}
               onSelectPartnerCheck={() => setActiveModule('partnerCheck')}
               onSelectSecretary={() => setActiveModule('secretary')}
               onSelectMarketing={() => setActiveModule('marketing')}
             />;
  }
};

export default UserView;