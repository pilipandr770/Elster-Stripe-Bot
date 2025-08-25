
import React, { useState, useEffect } from 'react';
import Button from './Button';
import Input from './Input';
import { MOCK_MARKETING_CHANNELS, MOCK_CONTENT_TOPICS, MOCK_SCHEDULED_POSTS } from '../constants';
import { MarketingChannel, ContentTopic, ScheduledPost } from '../types';
import { marketingService } from '../services/marketingService';
// Используем обычную svg напрямую вместо компонента
// import PlusIcon from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import BackButton from './BackButton';

interface MarketingProps {
  onBack: () => void;
}

const Marketing: React.FC<MarketingProps> = ({ onBack }) => {
  const [channels, setChannels] = useState<MarketingChannel[]>(MOCK_MARKETING_CHANNELS);
  const [topics, setTopics] = useState<ContentTopic[]>(MOCK_CONTENT_TOPICS);
  const [posts, setPosts] = useState<ScheduledPost[]>(MOCK_SCHEDULED_POSTS);
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'topics' | 'create' | 'analytics'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newChannel, setNewChannel] = useState<Partial<MarketingChannel>>({ platform: 'LinkedIn', url: '' });
  const [newTopic, setNewTopic] = useState<Partial<ContentTopic>>({ topic: '' });
  const [newPost, setNewPost] = useState<Partial<ScheduledPost>>({
    channelId: channels[0]?.id || '',
    topicId: topics[0]?.id || '',
    scheduledDate: new Date().toISOString().slice(0, 10),
    status: 'scheduled'
  });
  const [generatedContent, setGeneratedContent] = useState<{ title: string; text: string; mediaPrompt: string } | null>(null);
  const [frequency, setFrequency] = useState<'once' | 'weekly' | 'monthly'>('once');

  // Check API connection and connection state
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Check API connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await marketingService.checkApiConnection();
        setApiConnected(isConnected);
      } catch (error) {
        console.error('Error checking API connection:', error);
        setApiConnected(false);
      }
    };
    
    checkConnection();
  }, []);

  // Load data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Skip API calls if we know the connection is down
        if (apiConnected === false) {
          console.log('Using mock data due to API connection issues');
          setChannels(MOCK_MARKETING_CHANNELS);
          setTopics(MOCK_CONTENT_TOPICS);
          setPosts(MOCK_SCHEDULED_POSTS);
          setError('API connection failed. Using sample data instead.');
          return;
        }
        
        // For now, let's use mock data as a fallback
        // In a real implementation, you would remove the fallbacks
        try {
          const channelsData = await marketingService.getChannels();
          setChannels(channelsData.length > 0 ? channelsData : MOCK_MARKETING_CHANNELS);
        } catch (error) {
          console.error('Failed to load channels:', error);
          setChannels(MOCK_MARKETING_CHANNELS);
        }
        
        try {
          const topicsData = await marketingService.getTopics();
          setTopics(topicsData.length > 0 ? topicsData : MOCK_CONTENT_TOPICS);
        } catch (error) {
          console.error('Failed to load topics:', error);
          setTopics(MOCK_CONTENT_TOPICS);
        }
        
        try {
          const postsData = await marketingService.getPosts();
          setPosts(postsData.length > 0 ? postsData : MOCK_SCHEDULED_POSTS);
        } catch (error) {
          console.error('Failed to load posts:', error);
          setPosts(MOCK_SCHEDULED_POSTS);
        }
      } catch (error) {
        console.error('Error loading marketing data:', error);
        setError('Failed to load data. Using sample data instead.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [apiConnected]);

  const getChannelById = (id: string) => channels.find(c => c.id === id);
  const getTopicById = (id: string) => topics.find(t => t.id === id);

  // Handler functions
  const handleAddChannel = async () => {
    if (!newChannel.platform || !newChannel.url) {
      setError("Bitte Plattform und URL angeben");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare channel data
      const channelData: Partial<MarketingChannel> = {
        platform: newChannel.platform as MarketingChannel['platform'],
        url: newChannel.url,
        apiCredentials: newChannel.apiCredentials
      };
      
      // Try to save to API if connected
      if (apiConnected !== false) {
        try {
          const savedChannel = await marketingService.addChannel(channelData);
          setChannels([...channels, savedChannel]);
          setNewChannel({ platform: undefined, url: '', apiCredentials: {} });
          return;
        } catch (apiError) {
          console.error("Error saving to API:", apiError);
          // Fall back to local state if API call fails
        }
      }
      
      // Fallback to local state only
      const id = `ch_${Date.now()}`;
      const channel: MarketingChannel = {
        id,
        platform: newChannel.platform as MarketingChannel['platform'],
        url: newChannel.url as string,
        apiCredentials: newChannel.apiCredentials
      };
      
      setChannels([...channels, channel]);
      setNewChannel({ platform: 'LinkedIn', url: '' });
    } catch (error) {
      console.error("Error adding channel:", error);
      setError(`Fehler beim Hinzufügen des Kanals: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddTopic = async () => {
    if (!newTopic.topic) {
      setError("Bitte Thema eingeben");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare topic data
      const topicData: Partial<ContentTopic> = {
        topic: newTopic.topic
      };
      
      // Try to save to API if connected
      if (apiConnected !== false) {
        try {
          const savedTopic = await marketingService.addTopic(topicData);
          setTopics([...topics, savedTopic]);
          setNewTopic({ topic: '' });
          return;
        } catch (apiError) {
          console.error("Error saving topic to API:", apiError);
          // Fall back to local state if API call fails
        }
      }
      
      // Fallback to local state only
      const id = `t_${Date.now()}`;
      const topic: ContentTopic = {
        id,
        topic: newTopic.topic as string
      };
      
      setTopics([...topics, topic]);
      setNewTopic({ topic: '' });
    } catch (error) {
      console.error("Error adding topic:", error);
      setError(`Fehler beim Hinzufügen des Themas: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteChannel = (id: string) => {
    setIsLoading(true);
    
    // In a real app, make API call
    setTimeout(() => {
      setChannels(channels.filter(ch => ch.id !== id));
      setIsLoading(false);
    }, 500);
  };
  
  const handleDeleteTopic = (id: string) => {
    setIsLoading(true);
    
    // In a real app, make API call
    setTimeout(() => {
      setTopics(topics.filter(t => t.id !== id));
      setIsLoading(false);
    }, 500);
  };
  
  const handleGenerateContent = async () => {
    if (!newPost.channelId || !newPost.topicId) {
      setError("Bitte wählen Sie einen Kanal und ein Thema aus");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const selectedChannel = getChannelById(newPost.channelId as string);
    const selectedTopic = getTopicById(newPost.topicId as string);
    
    if (!selectedChannel || !selectedTopic) {
      setError("Kanal oder Thema nicht gefunden");
      setIsLoading(false);
      return;
    }
    
    try {
      // Try to generate content via API if connected
      if (apiConnected !== false) {
        try {
          const content = await marketingService.generateContent(
            newPost.channelId as string, 
            newPost.topicId as string
          );
          setGeneratedContent(content);
          return;
        } catch (apiError) {
          console.error("Error generating content via API:", apiError);
          // Fall back to mock content if API call fails
        }
      }
      
      // Fallback to mock generated content
      setGeneratedContent({
        title: `${selectedTopic.topic} - Inhalt für ${selectedChannel.platform}`,
        text: `Das ist automatisch generierter Inhalt zum Thema "${selectedTopic.topic}" für die Plattform ${selectedChannel.platform}. In einer echten Implementierung würde hier ein vollständiger Text stehen, der mit Hilfe von KI erstellt wurde.`,
        mediaPrompt: `Professionelles Bild, das das Konzept ${selectedTopic.topic} illustriert, mit einem Unternehmensstil, der für ${selectedChannel.platform} geeignet ist`
      });
    } catch (error) {
      console.error("Error generating content:", error);
      setError(`Fehler bei der Inhaltsgenerierung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreatePost = () => {
    if (!newPost.channelId || !newPost.topicId || !newPost.scheduledDate || !generatedContent) return;
    
    setIsLoading(true);
    setError(null);
    
    // In a real app, make API call
    setTimeout(() => {
      const id = `post_${Date.now()}`;
      const post: ScheduledPost = {
        id,
        channelId: newPost.channelId as string,
        topicId: newPost.topicId as string,
        scheduledDate: new Date(newPost.scheduledDate as string).toISOString(),
        status: 'scheduled',
        generatedContent,
        frequency: frequency === 'once' ? undefined : frequency
      };
      
      setPosts([...posts, post]);
      setNewPost({
        channelId: channels[0]?.id || '',
        topicId: topics[0]?.id || '',
        scheduledDate: new Date().toISOString().slice(0, 10),
        status: 'scheduled'
      });
      setGeneratedContent(null);
      setFrequency('once');
      setIsLoading(false);
      setActiveTab('overview');
    }, 500);
  };
  
  const handlePublishNow = (postId: string) => {
    setIsLoading(true);
    setError(null);
    
    // In a real app, make API call
    setTimeout(() => {
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, status: 'published', scheduledDate: new Date().toISOString() } 
          : p
      ));
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="mb-4">
        <BackButton onClick={onBack} />
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Marketing & Content</h2>
        <Button onClick={onBack} variant="secondary">Zurück zur Modulauswahl</Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Daten werden geladen...</span>
        </div>
      )}
      
      {/* API Connection Status */}
      {apiConnected === false && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                API-Verbindung nicht verfügbar. Demo-Daten werden angezeigt.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'channels'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kanäle verwalten
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'topics'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Themen
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inhalt erstellen
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analysen
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Strategy */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Ihre Kanäle</h3>
              <ul className="space-y-2">
                {channels.map(ch => (
                  <li key={ch.id} className="text-sm p-2 bg-gray-50 rounded">
                    <p className="font-semibold">{ch.platform}</p>
                    <a href={ch.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{ch.url}</a>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Button onClick={() => setActiveTab('channels')} variant="secondary" size="small">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg> Kanal hinzufügen
                </Button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Ihre Content-Themen</h3>
              <p className="text-sm text-gray-600 mb-4">Dies sind die Kernthemen, über die der KI-Assistent Inhalte erstellen wird.</p>
              <ul className="space-y-2">
                {topics.map(t => (
                  <li key={t.id} className="text-sm p-2 bg-gray-50 rounded font-medium">{t.topic}</li>
                ))}
              </ul>
              <div className="mt-4">
                <Button onClick={() => setActiveTab('topics')} variant="secondary" size="small">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg> Thema hinzufügen
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Content Calendar */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Content-Kalender</h3>
              <Button onClick={() => setActiveTab('create')} variant="primary" size="small">
                <SparklesIcon className="h-4 w-4 mr-1" /> Neuen Inhalt erstellen
              </Button>
            </div>
            <div className="flow-root">
              <ul className="-my-4 divide-y divide-gray-200">
                {posts.sort((a,b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()).map(post => {
                  const channel = getChannelById(post.channelId);
                  const topic = getTopicById(post.topicId);
                  const isPublished = post.status === 'published';

                  return (
                    <li key={post.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">{channel?.platform}</p>
                          <p className="text-md font-medium text-gray-800 truncate">{topic?.topic}</p>
                          <p className="text-sm text-gray-500">
                            {isPublished ? 'Veröffentlicht am' : 'Geplant für'}: {new Date(post.scheduledDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                            {post.frequency && <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{post.frequency === 'weekly' ? 'Wöchentlich' : 'Monatlich'}</span>}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${isPublished ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}`}>
                            {isPublished ? 'Veröffentlicht' : 'Geplant'}
                          </span>
                          {post.generatedContent && (
                            <Button 
                              variant="secondary" 
                              onClick={() => alert(`Vorschau:\n\nTITEL: ${post.generatedContent?.title}\n\nTEXT: ${post.generatedContent?.text}\n\nBILD-PROMPT: ${post.generatedContent?.mediaPrompt}`)}
                            >
                              Vorschau
                            </Button>
                          )}
                          {!isPublished && (
                            <Button 
                              variant="primary" 
                              onClick={() => handlePublishNow(post.id)}
                              disabled={isLoading}
                            >
                              Jetzt veröffentlichen
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Channels Management Tab */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Existing Channels */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Ihre Kanäle</h3>
            {channels.length === 0 ? (
              <p className="text-gray-500 italic">Noch keine Kanäle hinzugefügt.</p>
            ) : (
              <ul className="space-y-4">
                {channels.map(ch => (
                  <li key={ch.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{ch.platform}</p>
                        <a href={ch.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{ch.url}</a>
                        {ch.apiCredentials && <p className="text-xs text-gray-500 mt-1">API-Verbindung konfiguriert</p>}
                      </div>
                      <button 
                        onClick={() => handleDeleteChannel(ch.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isLoading}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Add New Channel */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Kanal hinzufügen</h3>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleAddChannel(); }}>
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">Plattform</label>
                <select 
                  id="platform"
                  value={newChannel.platform || 'LinkedIn'}
                  onChange={e => setNewChannel({...newChannel, platform: e.target.value as MarketingChannel['platform']})}
                  className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter / X">Twitter / X</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Blog">Blog</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <Input 
                  id="url"
                  type="text"
                  value={newChannel.url || ''}
                  onChange={e => setNewChannel({...newChannel, url: e.target.value})}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
              
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">API-Zugangsdaten (optional)</label>
                <details className="bg-gray-50 p-3 rounded-md">
                  <summary className="font-medium cursor-pointer">API-Konfiguration anzeigen</summary>
                  <div className="mt-3 space-y-3">
                    <Input 
                      type="text"
                      placeholder="API-Schlüssel"
                      value={newChannel.apiCredentials?.apiKey || ''}
                      onChange={e => setNewChannel({
                        ...newChannel, 
                        apiCredentials: {
                          ...(newChannel.apiCredentials || {}),
                          apiKey: e.target.value
                        }
                      })}
                    />
                    <Input 
                      type="password"
                      placeholder="API-Secret"
                      value={newChannel.apiCredentials?.apiSecret || ''}
                      onChange={e => setNewChannel({
                        ...newChannel, 
                        apiCredentials: {
                          ...(newChannel.apiCredentials || {}),
                          apiSecret: e.target.value
                        }
                      })}
                    />
                    <Input 
                      type="text"
                      placeholder="Benutzername (falls erforderlich)"
                      value={newChannel.apiCredentials?.username || ''}
                      onChange={e => setNewChannel({
                        ...newChannel, 
                        apiCredentials: {
                          ...(newChannel.apiCredentials || {}),
                          username: e.target.value
                        }
                      })}
                    />
                  </div>
                </details>
              </div>
              
              <div className="pt-2">
                <Button type="submit" disabled={isLoading || !newChannel.url}>
                  {isLoading ? 'Wird hinzugefügt...' : 'Kanal hinzufügen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Topics Management Tab */}
      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Existing Topics */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Ihre Content-Themen</h3>
            {topics.length === 0 ? (
              <p className="text-gray-500 italic">Noch keine Themen hinzugefügt.</p>
            ) : (
              <ul className="space-y-3">
                {topics.map(topic => (
                  <li key={topic.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                    <p className="font-medium">{topic.topic}</p>
                    <button 
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isLoading}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Add New Topic */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Thema hinzufügen</h3>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleAddTopic(); }}>
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">Thema</label>
                <Input 
                  id="topic"
                  type="text"
                  value={newTopic.topic || ''}
                  onChange={e => setNewTopic({...newTopic, topic: e.target.value})}
                  placeholder="z.B. Vorteile unseres neuen Produkts für mittelständische Unternehmen"
                />
              </div>
              
              <div className="pt-2">
                <Button type="submit" disabled={isLoading || !newTopic.topic}>
                  {isLoading ? 'Wird hinzugefügt...' : 'Thema hinzufügen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Content Creation Tab */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Creation Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Neuen Inhalt erstellen</h3>
            
            {channels.length === 0 || topics.length === 0 ? (
              <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 text-sm">
                <p>Sie müssen zuerst {channels.length === 0 ? 'Kanäle' : ''}{channels.length === 0 && topics.length === 0 ? ' und ' : ''}{topics.length === 0 ? 'Themen' : ''} hinzufügen, bevor Sie Inhalte erstellen können.</p>
              </div>
            ) : (
              <form className="space-y-4">
                <div>
                  <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">Kanal</label>
                  <select 
                    id="channel"
                    value={newPost.channelId}
                    onChange={e => setNewPost({...newPost, channelId: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                  >
                    {channels.map(channel => (
                      <option key={channel.id} value={channel.id}>{channel.platform}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">Thema</label>
                  <select 
                    id="topic"
                    value={newPost.topicId}
                    onChange={e => setNewPost({...newPost, topicId: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                  >
                    {topics.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.topic}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Veröffentlichungsdatum</label>
                  <Input 
                    id="date"
                    type="date"
                    value={typeof newPost.scheduledDate === 'string' ? newPost.scheduledDate.slice(0, 10) : ''}
                    onChange={e => setNewPost({...newPost, scheduledDate: e.target.value})}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">Häufigkeit</label>
                  <select 
                    id="frequency"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as 'once' | 'weekly' | 'monthly')}
                    className="w-full p-2 border rounded focus:ring-primary focus:border-primary"
                  >
                    <option value="once">Einmalig</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="monthly">Monatlich</option>
                  </select>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={(e) => { e.preventDefault(); handleGenerateContent(); }} 
                    disabled={isLoading || !newPost.channelId || !newPost.topicId || !newPost.scheduledDate}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generiere Inhalte...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Mit KI-Inhalt generieren
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
          
          {/* Generated Content Preview */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Inhalts-Vorschau</h3>
            
            {generatedContent ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Titel</h4>
                  <div className="p-3 bg-gray-50 rounded-md">{generatedContent.title}</div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Text</h4>
                  <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{generatedContent.text}</div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Bild-Prompt</h4>
                  <div className="p-3 bg-gray-50 rounded-md italic text-gray-600">{generatedContent.mediaPrompt}</div>
                </div>
                
                <div className="pt-4 flex space-x-2">
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Wird geplant...' : 'Veröffentlichung planen'}
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => setGeneratedContent(null)}
                  >
                    Verwerfen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 italic">
                Generieren Sie Inhalte, um eine Vorschau zu sehen
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-800">Leistungsanalyse</h3>
            <div className="flex items-center space-x-4">
              <select className="p-2 border rounded">
                <option>Letzter Monat</option>
                <option>Letzte 3 Monate</option>
                <option>Letztes Jahr</option>
              </select>
              <Button variant="secondary" size="small">
                <ChartBarIcon className="h-4 w-4 mr-1" /> Export
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Gesamtreichweite</p>
              <p className="text-2xl font-bold">3.724</p>
              <p className="text-xs text-green-600">+12% im Vergleich zum Vormonat</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Interaktionen</p>
              <p className="text-2xl font-bold">487</p>
              <p className="text-xs text-green-600">+8% im Vergleich zum Vormonat</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Durchschn. Engagement-Rate</p>
              <p className="text-2xl font-bold">13,1%</p>
              <p className="text-xs text-red-600">-2% im Vergleich zum Vormonat</p>
            </div>
          </div>
          
          <h4 className="font-medium text-gray-800 mb-2">Leistung nach Kanal</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kanal</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reichweite</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">LinkedIn</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">12</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">2.480</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">324</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">13,1%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Blog</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">4</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">1.244</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">163</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">13,1%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-8">
            <h4 className="font-medium text-gray-800 mb-4">Beste Posts des Monats</h4>
            <div className="space-y-4">
              {posts
                .filter(post => post.status === 'published')
                .slice(0, 2)
                .map(post => {
                  const channel = getChannelById(post.channelId);
                  const topic = getTopicById(post.topicId);
                  
                  return (
                    <div key={post.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-primary font-medium">{channel?.platform}</p>
                          <p className="font-medium">{post.generatedContent?.title || topic?.topic}</p>
                          <p className="text-sm text-gray-500">Veröffentlicht am {new Date(post.scheduledDate).toLocaleDateString('de-DE')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Reichweite</p>
                          <p className="font-bold">1.243</p>
                          <p className="text-xs text-green-600">Engagement: 21%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;