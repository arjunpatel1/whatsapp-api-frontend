import { API_BASE_URL } from './constants';

export const api = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  if (endpoint.includes('/api/send/')) {
    try {
      const user = userStr ? JSON.parse(userStr) : null;
      if (user && user.auth_key) {
        headers['authkey'] = user.auth_key;
      }
    } catch (e) {
      console.error('Error reading authKey for send endpoint:', e);
    }
  }

  const config = { method, headers };
  if (data) config.body = JSON.stringify(data);

  const base = API_BASE_URL.replace(/\/$/, '');
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const res = await fetch(url, config);
  
  const responseText = await res.text();
  let json;
  try {
    json = JSON.parse(responseText);
  } catch (e) {
    if (!res.ok) {
      throw new Error(`Server Error (${res.status}): ${responseText.slice(0, 150) || res.statusText}`);
    }
    throw new Error('Invalid JSON response from server');
  }

  if (!res.ok) {
    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(json.error || json.message || 'API Error');
  }
  return json;
};
