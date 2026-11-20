const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function csrfCookieNameForPath(path) {
  return path.startsWith('/auth/refresh') ? 'csrf_refresh_token' : 'csrf_access_token';
}

function buildHeaders(options = {}, path = '') {
  const headers = new Headers(options.headers || {});
  const body = options.body;
  const method = (options.method || 'GET').toUpperCase();

  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = getCookie(csrfCookieNameForPath(path));
    if (csrf && !headers.has('X-CSRF-TOKEN')) {
      headers.set('X-CSRF-TOKEN', csrf);
    }
  }

  return headers;
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  return response.text();
}

function shouldTryRefresh(path, status, retry) {
  if (!retry || status !== 401) return false;
  return !path.startsWith('/auth/login')
    && !path.startsWith('/auth/register')
    && !path.startsWith('/auth/refresh');
}

async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCookie('csrf_refresh_token') || '',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function toRequestBody(body) {
  if (!body) return undefined;
  if (body instanceof FormData || typeof body === 'string') return body;
  return JSON.stringify(body);
}

async function request(path, options = {}, retry = true) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options, path),
    credentials: 'include',
  });

  const data = await parseResponse(response);

  if (shouldTryRefresh(path, response.status, retry)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, options, false);
    }
  }

  if (!response.ok) {
    const message = (data && data.error) || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: toRequestBody(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: toRequestBody(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: toRequestBody(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export { API_URL };
