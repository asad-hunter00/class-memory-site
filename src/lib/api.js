// Backend bilan aloqa: hamma so'rov shu yerdan o'tadi.
export const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '').replace(/\/api$/, '');
export const API_URL = SERVER_URL + '/api';

const TOKEN_KEY = 'token';
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status, errors) { super(message); this.status = status; this.errors = errors; }
}

async function request(method, path, { body, query, raw } = {}) {
  let url = API_URL + path;
  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, v); });
    const s = qs.toString();
    if (s) url += '?' + s;
  }
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch {
    throw new ApiError("Serverga ulanib bo'lmadi. Internetni tekshiring (server uyg'onayotgan bo'lishi mumkin, 30 soniya kuting).", 0);
  }
  let json = null;
  try { json = await res.json(); } catch { /* bo'sh javob */ }
  if (!res.ok || (json && json.success === false)) {
    if (res.status === 401 && token) onUnauthorized();
    const fieldMsg = json?.errors?.[0]?.message;
    throw new ApiError(fieldMsg || json?.message || `Xatolik (${res.status})`, res.status, json?.errors);
  }
  return raw ? json : json?.data;
}

// Ro'yxatlar uchun: {items, pagination}
async function list(path, query) {
  const json = await request('GET', path, { query, raw: true });
  return { items: json?.data ?? [], pagination: json?.pagination ?? null };
}

export const api = {
  get: (p, query) => request('GET', p, { query }),
  list,
  post: (p, body) => request('POST', p, { body }),
  patch: (p, body) => request('PATCH', p, { body }),
  del: (p, body) => request('DELETE', p, { body }),
};
