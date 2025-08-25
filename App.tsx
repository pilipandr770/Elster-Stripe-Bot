import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ChatAssistant from './components/ChatAssistant';
import Login from './components/Login';
import UserView from './components/UserView';
import AdminDashboard from './components/AdminDashboard';
import { User, Admin, Module } from './types';
import { login as apiLogin, register as apiRegister, logout as apiLogout, loadSession } from './services/authService';
import { MOCK_USERS } from './constants';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Footer from './components/Footer';
import Impressum from './components/Impressum';
import Datenschutz from './components/Datenschutz';
import AGB from './components/AGB';
import { detectModuleContext } from './services/contextDetectionService';
import { AppProvider } from './contexts/AppContext';

// Minimal safe access to Vite env without type declarations
let ADMIN_EMAIL = 'admin@example.com';
try { // @ts-ignore
  if ((import.meta as any)?.env?.VITE_ADMIN_EMAIL) { // @ts-ignore
    ADMIN_EMAIL = (import.meta as any).env.VITE_ADMIN_EMAIL; }
} catch(_) {}

type LegalView = 'impressum' | 'agb' | 'datenschutz' | null;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | Admin | null>(null);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [legalView, setLegalView] = useState<LegalView>(null);
  const [activeModule, setActiveModule] = useState<Module | 'selection'>('selection');
  
  // Автоматическое определение контекста приложения для корректного отображения ассистента
  useEffect(() => {
    // Если мы находимся на странице выбора модуля, не определяем контекст автоматически
    if (activeModule === 'selection') {
      return;
    }
    
    // Пытаемся определить контекст из URL, содержимого страницы и т.д.
    const detectedModule = detectModuleContext();
    
    // Если удалось определить контекст, и он отличается от текущего,
    // автоматически обновляем активный модуль
    if (detectedModule && detectedModule !== activeModule) {
      console.log(`Automatically detected module context: ${detectedModule}`);
      setActiveModule(detectedModule);
    }
  }, [activeModule]);


  const handleLogin = useCallback(async (email: string, pass: string) => {
    try {
      const { user } = await apiLogin(email, pass);
      setCurrentUser(user.role === 'admin' ? { id: user.id, email: user.email, role: 'admin' } : {
        id: user.id,
        email: user.email,
        role: 'user',
        subscriptionStatus: 'active',
        lastLogin: user.lastLogin || new Date().toISOString(),
      });
      setActiveModule('selection');
    } catch (e:any) {
      alert(e.message || 'Login fehlgeschlagen');
    }
  }, []);

  const handleRegister = useCallback(async (email: string, pass: string) => {
    try {
      const { user } = await apiRegister(email, pass);
      setCurrentUser(user.role === 'admin' ? { id: user.id, email: user.email, role: 'admin' } : {
        id: user.id,
        email: user.email,
        role: 'user',
        subscriptionStatus: 'trial',
        lastLogin: new Date().toISOString(),
      });
      setActiveModule('selection');
    } catch (e:any) {
      alert(e.message || 'Registrierung fehlgeschlagen');
    }
  }, []);
  
  const handleLogout = useCallback(() => {
    apiLogout();
    setCurrentUser(null);
    setAuthView('landing');
    setActiveModule('selection');
  }, []);

  // load session on mount
  React.useEffect(() => {
    const sess = loadSession();
    if (sess?.user) {
      const u = sess.user;
      setCurrentUser(u.role === 'admin' ? { id: u.id, email: u.email, role: 'admin' } : {
        id: u.id,
        email: u.email,
        role: 'user',
        subscriptionStatus: 'active',
        lastLogin: u.lastLogin || new Date().toISOString(),
      });
    }
  }, []);
  
  const renderLegalPage = () => {
    switch (legalView) {
      case 'impressum':
        return <Impressum onClose={() => setLegalView(null)} />;
      case 'datenschutz':
        return <Datenschutz onClose={() => setLegalView(null)} />;
      case 'agb':
        return <AGB onClose={() => setLegalView(null)} />;
      default:
        return null;
    }
  };

  const unauthenticatedView = () => {
    switch (authView) {
      case 'login':
        return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
      case 'register':
        return <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />;
      case 'landing':
      default:
        return <LandingPage onShowLogin={() => setAuthView('login')} onShowRegister={() => setAuthView('register')} onShowLegalPage={setLegalView} />;
    }
  }

  if (!currentUser) {
    return (
      <>
        {unauthenticatedView()}
        {renderLegalPage()}
      </>
    );
  }

  return (
    <AppProvider activeModule={activeModule} setActiveModule={setActiveModule}>
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-800">
        <Header onBackToHome={() => setActiveModule('selection')} showBackButton={activeModule !== 'selection'} />
        <main className="flex-grow container mx-auto px-4 py-8">
          {currentUser.role === 'admin' ? (
            <AdminDashboard admin={currentUser} onLogout={handleLogout} users={MOCK_USERS} />
          ) : (
            <UserView 
              onLogout={handleLogout} 
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
          )}
        </main>
        <Footer onShowLegalPage={setLegalView} />
        {currentUser.role === 'user' && activeModule !== 'selection' && <ChatAssistant module={activeModule} />}
        {renderLegalPage()}
      </div>
    </AppProvider>
  );
};

export default App;