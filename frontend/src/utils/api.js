export const api = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const config = { method, headers };
  if (data) config.body = JSON.stringify(data);

  const res = await fetch(endpoint, config);
  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error('Invalid JSON response from server');
  }

  if (!res.ok) {
    throw new Error(json.error || 'API Error');
  }
  return json;
};
