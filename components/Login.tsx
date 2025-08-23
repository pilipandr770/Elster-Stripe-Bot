
import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';
import { TaxIcon } from './icons/TaxIcon';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // In a real app, you wouldn't have a generic error like this.
    // This is just to guide the admin user for the demo.
    if (email !== 'pylypchukandrii770@gmail.com' && password !== '123321' && (email.includes('admin') || email.includes('pyly'))) {
        setError('Ungültige Anmeldedaten für den Administrator.');
    }
    onLogin(email, password);
  };

  return (
     <div className="min-h-screen bg-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
            <TaxIcon className="h-12 w-12 text-primary" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Willkommen zurück</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
                Melden Sie sich an, um Ihr Dashboard aufzurufen.
            </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                id="email"
                label="E-Mail-Adresse"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.com"
              />
            </div>
            <div>
              <Input
                id="password"
                label="Passwort"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={!email || !password}>
              Anmelden
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Noch kein Konto?{' '}
            <button onClick={onSwitchToRegister} className="font-medium text-primary hover:text-primary-focus">
              Kostenlos registrieren
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;