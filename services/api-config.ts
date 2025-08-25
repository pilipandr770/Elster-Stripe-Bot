// api-config.ts

// Get the API base URL from environment variables
const getAPIBaseUrl = (): string => {
  // Используем относительный путь для API запросов в продакшене
  // Это позволит Nginx корректно проксировать запросы к backend
  return '/api';
};

export const API_BASE_URL = getAPIBaseUrl();

// Helper function for API requests
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Добавляем токен аутентификации если он есть
  const token = localStorage.getItem('auth_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      },
    });
    
    if (!response.ok) {
      // Пытаемся получить более подробную информацию об ошибке
      const errorText = await response.text();
      let errorJson = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Текст не в формате JSON
      }
      
      throw new Error(
        errorJson['error']?.message || 
        errorJson['message'] || 
        `API error: ${response.status} ${response.statusText}`
      );
    }
    
    // Если нет тела ответа (204 No Content)
    if (response.status === 204) {
      return {};
    }
    
    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
