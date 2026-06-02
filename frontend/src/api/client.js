// In dev (npm run dev), Vite proxies /api → localhost:5000
// In production (served from Express), /api is on the same server
// We detect which mode we're in by checking the port
const isDev = window.location.port === '3000';
const BASE = isDev ? '/api' : '/api';

function getToken() {
  return localStorage.getItem('pos_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (networkErr) {
    throw new Error('Cannot reach server. Is the backend running on port 5000?');
  }

  // Handle non-JSON responses gracefully
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server returned non-JSON response (status ${res.status})`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  delete: (path)       => request('DELETE', path),
};
