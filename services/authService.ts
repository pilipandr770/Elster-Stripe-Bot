import { fetchAPI } from './api-config';

interface AuthResponse {
  token: string;
  user: { id: string; email: string; role: string; lastLogin?: string };
}

async function request(path: string, body: any): Promise<AuthResponse> {
  try {
    return await fetchAPI(`auth/${path}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    throw new Error(msg);
  }
}

export async function register(email: string, password: string) {
  const data = await request('register', { email, password });
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data;
}

export async function login(email: string, password: string) {
  const data = await request('login', { email, password });
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export function loadSession() {
  try {
    const token = localStorage.getItem('auth_token');
    const userRaw = localStorage.getItem('auth_user');
    if (token && userRaw) {
      return { token, user: JSON.parse(userRaw) };
    }
  } catch(_) {}
  return null;
}
