
import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';
import { TaxIcon } from './icons/TaxIcon';

interface RegisterProps {
  onRegister: (email: string, pass: string) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    onRegister(email, password);
  };

  return (
    <div className="min-h-screen bg-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
            <TaxIcon className="h-12 w-12 text-primary" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Erstellen Sie Ihr Konto</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
                Starten Sie in wenigen Minuten mit der Automatisierung.
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
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
             <div>
               <Input
                id="confirmPassword"
                label="Passwort bestätigen"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={!email || !password || !confirmPassword}>
              Konto erstellen
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Haben Sie bereits ein Konto?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-primary hover:text-primary-focus">
              Hier anmelden
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;