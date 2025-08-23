import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';

interface SettingsProps {
  onConnect: (stripeKey: string, taxId: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ onConnect }) => {
  const [stripeKey, setStripeKey] = useState('');
  const [taxId, setTaxId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Import services dynamically to avoid issues with SSR
      const { connectStripeAccount } = await import('../services/stripeService');
      const { connectElsterAccount } = await import('../services/elsterService');
      
      // Connect both accounts
      if (stripeKey) {
        await connectStripeAccount(stripeKey);
      }
      
      if (taxId) {
        await connectElsterAccount(taxId);
      }
      
      setSuccess('Beide Konten wurden erfolgreich verbunden!');
      // Call the parent component's callback if needed
      onConnect(stripeKey, taxId);
    } catch (error) {
      console.error('Error connecting accounts:', error);
      setError('Fehler beim Verbinden der Konten. Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-xl animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900">Verbinden Sie Ihre Konten</h2>
      <p className="mt-2 text-sm text-gray-600">
        Um Ihre Steuererklärung zu automatisieren, geben Sie bitte Ihren Stripe API-Schlüssel und Ihre deutsche Steuer-ID an.
        Diese Informationen werden sicher behandelt und nur zur Synchronisierung Ihrer Transaktionen und deren Übermittlung an ELSTER verwendet.
      </p>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 border border-green-200 rounded">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <Input
            id="taxId"
            label="Deutsche Steuer-ID (IdNr)"
            type="text"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="01 234 567 890"
            info="Ihre 11-stellige persönliche steuerliche Identifikationsnummer."
          />
        </div>
        <div>
          <Input
            id="stripeKey"
            label="Stripe API-Schlüssel (Secret Key)"
            type="text"
            value={stripeKey}
            onChange={(e) => setStripeKey(e.target.value)}
            placeholder="sk_live_..."
            info="Diesen finden Sie in Ihrem Stripe Dashboard unter Entwickler > API-Schlüssel."
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={(!stripeKey && !taxId) || isSubmitting}
        >
          {isSubmitting ? 'Verbinde...' : 'Verbinden und Automatisieren'}
        </Button>
      </form>
    </div>
  );
};

export default Settings;
