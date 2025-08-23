interface AuthResponse {
  token: string;
  user: { id: string; email: string; role: string; lastLogin?: string };
}

let API_BASE = 'http://localhost:5000';
try { // @ts-ignore
  if ((import.meta as any)?.env?.VITE_API_BASE_URL) { // @ts-ignore
    API_BASE = (import.meta as any).env.VITE_API_BASE_URL; }
} catch(_) {}

async function request(path: string, body: any): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    let msg = 'Unbekannter Fehler';
    try { const j = await res.json(); msg = j.error?.message || msg; } catch(_) {}
    throw new Error(msg);
  }
  return res.json();
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
