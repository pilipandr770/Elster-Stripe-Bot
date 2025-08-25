import { Module } from '../types';

// Типы моделей AI
export type AIModelType = 'gemini' | 'openai';

// Настройки пользователя для моделей по модулям
interface ModuleModelPreferences {
  [key: string]: AIModelType;  // module -> model preference
}

// Minimal typing / fallback for environments without Vite
declare const importMeta: { env?: { VITE_API_BASE_URL?: string } };

// Получаем сохраненные настройки моделей или используем значения по умолчанию
export function getModuleModelPreference(module: Module): AIModelType {
  try {
    const storedPrefs = localStorage.getItem('moduleModelPreferences');
    if (storedPrefs) {
      const prefs = JSON.parse(storedPrefs) as ModuleModelPreferences;
      if (prefs[module]) {
        return prefs[module];
      }
    }
  } catch (e) {
    console.warn('Failed to get module model preference:', e);
  }
  
  // Default preferences if nothing stored
  const defaultPreferences: ModuleModelPreferences = {
    'accounting': 'gemini',
    'partner_check': 'gemini',
    'secretary': 'gemini',
    'marketing': 'gemini'
  };
  
  return defaultPreferences[module] || 'gemini';
}

// Сохраняем настройку модели для модуля
export function saveModuleModelPreference(module: Module, modelType: AIModelType): void {
  try {
    const storedPrefs = localStorage.getItem('moduleModelPreferences');
    const prefs: ModuleModelPreferences = storedPrefs ? JSON.parse(storedPrefs) : {};
    
    prefs[module] = modelType;
    localStorage.setItem('moduleModelPreferences', JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save module model preference:', e);
  }
}

function getApiEndpoint(module: Module): string {
    // Determine backend URL with fallbacks
    let backendUrl = 'http://localhost:5000';
    try {
        // @ts-ignore
        if ((import.meta as any)?.env?.VITE_API_BASE_URL) {
            // @ts-ignore
            backendUrl = (import.meta as any).env.VITE_API_BASE_URL;
        } else if (importMeta?.env?.VITE_API_BASE_URL) {
            backendUrl = importMeta.env.VITE_API_BASE_URL;
        }
    } catch (_) {
        // ignore fallback remains
    }
    switch (module) {
        case 'accounting':
            return `${backendUrl}/api/accounting/chat`;
        case 'partner_check':
            return `${backendUrl}/api/partner_check/chat`;
        case 'secretary':
            return `${backendUrl}/api/secretary/chat`;
        case 'marketing':
            return `${backendUrl}/api/marketing/chat`;
        default:
            // Обработка неизвестного модуля
            console.error(`Unknown module requested: ${module}`);
            throw new Error(`Unknown module: ${module}`);
    }
}

export async function* streamChat(message: string, module: Module, modelType?: AIModelType): AsyncGenerator<string> {
    const endpoint = getApiEndpoint(module);
    // Используем сохраненную настройку модели, если не указана явно
    const modelToUse = modelType || getModuleModelPreference(module);

    try {
    let token: string | null = null;
    try { token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; } catch(_) {}
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ 
                message,
                model_type: modelToUse  // Передаем предпочитаемую модель на сервер
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`HTTP error! status: ${response.status}`, errorBody);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            yield decoder.decode(value, { stream: true });
        }

    } catch (error) {
        console.error("Error streaming chat from backend:", error);
        yield "Bei der Kommunikation mit dem Server ist ein Fehler aufgetreten. Bitte überprüfen Sie die Konsole für Details.";
    }
}
