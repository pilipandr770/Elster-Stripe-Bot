import React, { useState, useEffect } from 'react';
import { GoogleCalendarConfig } from '../types';
import { connectGoogleCalendar, updateCalendarConfig } from '../services/calendarService';
import Button from './Button';
import Input from './Input';

interface CalendarSettingsProps {
  initialConfig?: GoogleCalendarConfig;
  onConfigChange?: (config: GoogleCalendarConfig) => void;
}

const GoogleCalendarSettings: React.FC<CalendarSettingsProps> = ({ 
  initialConfig, 
  onConfigChange 
}) => {
  const [config, setConfig] = useState<GoogleCalendarConfig>(initialConfig || {
    enabled: false,
    calendarId: '',
    authToken: '',
    allowEventCreation: false,
    allowEventModification: false
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleOAuthLogin = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // OAuth 2.0 flow
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const redirectUri = window.location.origin + '/secretary';
      const scope = 'https://www.googleapis.com/auth/calendar';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
      
      // Open the auth window
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate Google Calendar connection');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Check for OAuth callback code in URL
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');
      
      if (authCode) {
        setIsConnecting(true);
        setError(null);
        
        try {
          // Exchange code for token
          const result = await connectGoogleCalendar(authCode);
          
          if (result.success && result.calendarId) {
            setConfig(prev => ({
              ...prev,
              enabled: true,
              calendarId: result.calendarId || prev.calendarId
            }));
            
            setSuccess('Google Calendar connected successfully!');
            
            // Clear the URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            if (onConfigChange) {
              onConfigChange({
                ...config,
                enabled: true,
                calendarId: result.calendarId
              });
            }
          }
        } catch (err) {
          setError('Failed to complete Google Calendar connection');
          console.error(err);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveConfig = async () => {
    setError(null);
    
    try {
      const result = await updateCalendarConfig(config);
      
      if (result.success) {
        setSuccess('Calendar settings saved successfully!');
        
        if (onConfigChange) {
          onConfigChange(config);
        }
      }
    } catch (err) {
      setError('Failed to save calendar settings');
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-medium mb-4">Google Calendar Integration</h3>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      {!config.calendarId ? (
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            Connect your Google Calendar to allow the secretary assistant to access and manage your calendar.
          </p>
          <Button 
            onClick={handleOAuthLogin}
            loading={isConnecting}
            disabled={isConnecting}
          >
            Connect Google Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={config.enabled}
              onChange={handleConfigChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
              Enable Google Calendar integration
            </label>
          </div>
          
          <div>
            <label htmlFor="calendarId" className="block text-sm font-medium text-gray-700 mb-1">
              Calendar ID
            </label>
            <Input
              id="calendarId"
              name="calendarId"
              type="text"
              value={config.calendarId}
              onChange={handleConfigChange}
              placeholder="primary"
              disabled={!config.enabled}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowEventCreation"
              name="allowEventCreation"
              checked={config.allowEventCreation}
              onChange={handleConfigChange}
              disabled={!config.enabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowEventCreation" className="ml-2 block text-sm text-gray-900">
              Allow the assistant to create calendar events
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowEventModification"
              name="allowEventModification"
              checked={config.allowEventModification}
              onChange={handleConfigChange}
              disabled={!config.enabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowEventModification" className="ml-2 block text-sm text-gray-900">
              Allow the assistant to modify and delete calendar events
            </label>
          </div>
          
          <div className="mt-4">
            <Button onClick={handleSaveConfig}>
              Save Calendar Settings
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleOAuthLogin} 
              className="ml-3"
            >
              Reconnect Calendar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarSettings;
