
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SendIcon } from './icons/SendIcon';
import { CogIcon } from './icons/CogIcon';
import { ChatMessage, Module } from '../types';
import { streamChat, AIModelType, getModuleModelPreference, saveModuleModelPreference } from '../services/geminiService';

interface ChatAssistantProps {
  module: Module;
}

// Получаем имя модуля для отображения
function getModuleName(module: Module): string {
  switch (module) {
    case 'accounting': return 'Buchhaltung';
    case 'partnerCheck': return 'Partner-Check';
    case 'secretary': return 'KI-Sekretär';
    case 'marketing': return 'KI-Marketing';
    default: return 'Chat';
  }
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ module }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentModelType, setCurrentModelType] = useState<AIModelType>(() => 
    getModuleModelPreference(module)
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Clear chat history when the user switches modules for a clean slate
    setMessages([]);
    setInput('');
    // Update the model type based on saved preferences for this module
    setCurrentModelType(getModuleModelPreference(module));
  }, [module]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChangeModelType = useCallback((modelType: AIModelType) => {
    setCurrentModelType(modelType);
    saveModuleModelPreference(module, modelType);
  }, [module]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = { 
      id: aiMessageId, 
      sender: 'ai', 
      text: '', 
      isStreaming: true,
      // Сохраняем информацию о используемой модели для отображения
      metadata: { modelType: currentModelType }
    };
    setMessages(prev => [...prev, aiMessage]);
    
    try {
      // Используем текущую модель для запроса
      const stream = streamChat(input, module, currentModelType);
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: fullText } : msg
        ));
      }
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
      ));
    } catch (error) {
      console.error('Error streaming chat:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, text: 'Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.', isStreaming: false } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, module]);

  const getHelperTitle = () => {
    switch(module) {
        case 'accounting': return 'Buchhaltungs-Helfer';
        case 'partnerCheck': return 'Partnerprüfungs-Helfer';
        case 'secretary': return 'Sekretariats-Helfer';
        case 'marketing': return 'Marketing-Helfer';
        default: return 'Elster Helfer';
    }
  }

  // Переключение настроек модели
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
        {isOpen && (
          <div className="bg-white rounded-md shadow-lg p-3 mb-2 flex items-center text-sm">
            <span className="mr-2">Sie nutzen <b>{getModuleName(module)}</b> mit Modell:</span>
            <button 
              className={`px-2 py-1 rounded-md mr-1 ${currentModelType === 'gemini' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={() => handleChangeModelType('gemini')}
            >
              Gemini
            </button>
            <button 
              className={`px-2 py-1 rounded-md ${currentModelType === 'openai' ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={() => handleChangeModelType('openai')}
            >
              OpenAI
            </button>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus transition-transform hover:scale-110"
          aria-label="Chat umschalten"
        >
          {isOpen ? <CloseIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
        </button>
      </div>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-[28rem] bg-white rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in-up">
          <div className="bg-primary text-white p-4 rounded-t-lg">
            <h3 className="font-bold text-lg">{getHelperTitle()}</h3>
            <p className="text-sm opacity-90">Fragen zum aktuellen Modul.</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.length === 0 && (
                <div className="flex justify-start">
                    <div className="rounded-lg px-3 py-2 max-w-xs bg-gray-200 text-gray-800">
                        Hallo! Wie kann ich Ihnen heute helfen?
                    </div>
                </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} flex-col`}>
                <div className={`rounded-lg px-3 py-2 max-w-xs ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.text}
                  {msg.sender === 'ai' && msg.metadata?.modelType && (
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      via {msg.metadata.modelType === 'gemini' ? 'Gemini' : 'OpenAI'}
                    </div>
                  )}
                  {msg.isStreaming && <span className="inline-block w-2 h-2 ml-1 bg-gray-500 rounded-full animate-pulse"></span>}
                </div>
              </div>
            ))}
             <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Geben Sie Ihre Frage ein..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                disabled={isLoading}
              />
              <button type="submit" className="ml-2 p-2 rounded-full text-primary hover:bg-indigo-100 disabled:text-gray-400 disabled:hover:bg-transparent" disabled={isLoading || !input.trim()}>
                <SendIcon className="h-5 w-5"/>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
