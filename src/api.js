// Backend bilan ishlash uchun yagona joy
const RAW = import.meta.env.VITE_API_URL || 'https://backend-class-bvno.onrender.com';
export const SERVER_URL = RAW.replace(/\/+$/, '').replace(/\/api$/, '');
const API_URL = SERVER_URL + '/api';

const TOKEN_KEY = 'token';
export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(method, path, { body, params } = {}) {
  let url = API_URL + path;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const s = qs.toString();
    if (s) url += '?' + s;
  }
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Serverga ulanib bo\'lmadi. Internetni tekshiring yoki birozdan keyin urinib ko\'ring.', 0);
  }
  let json = null;
  try { json = await res.json(); } catch { /* bo'sh javob */ }

  if (!res.ok || (json && json.success === false)) {
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event('auth:expired'));
    }
    const first = json?.errors?.[0]?.message;
    throw new ApiError(first || json?.message || `Xatolik (${res.status})`, res.status, json?.errors);
  }
  return json || { success: true, data: null };
}

export const api = {
  get: (p, params) => request('GET', p, { params }),
  post: (p, body) => request('POST', p, { body: body ?? {} }),
  patch: (p, body) => request('PATCH', p, { body: body ?? {} }),
  del: (p) => request('DELETE', p),
};

// ---- Cloudinary: to'g'ridan-to'g'ri yuklash (imzo backenddan olinadi) ----
export function uploadToCloudinary(file, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      const sig = (await api.get('/uploads/signature')).data;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', sig.timestamp);
      fd.append('signature', sig.signature);
      fd.append('folder', sig.folder);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', sig.uploadUrl);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const r = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            const isVideo = r.resource_type === 'video';
            resolve({
              url: r.secure_url,
              type: isVideo ? 'video' : 'image',
              duration: r.duration ? Math.round(r.duration) : null,
              thumbnail: isVideo ? r.secure_url.replace(/\.[a-z0-9]+$/i, '.jpg') : thumb(r.secure_url, 600),
            });
          } else {
            reject(new Error(r?.error?.message || 'Yuklashda xatolik'));
          }
        } catch {
          reject(new Error('Yuklashda xatolik'));
        }
      };
      xhr.onerror = () => reject(new Error('Yuklashda tarmoq xatosi'));
      xhr.send(fd);
    } catch (e) {
      reject(e);
    }
  });
}

// Cloudinary rasmini kichraytirib olish (tez yuklanishi uchun)
export function thumb(url, w = 500) {
  if (!url || !url.includes('/image/upload/')) return url;
  return url.replace('/image/upload/', `/image/upload/c_limit,w_${w},q_auto,f_auto/`);
}

export function videoPoster(v) {
  return v?.thumbnailUrl || (v?.videoUrl ? v.videoUrl.replace(/\.[a-z0-9]+$/i, '.jpg') : '');
}

export function fmtDuration(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const REACTIONS = [
  { type: 'HEART', emoji: '❤️', label: 'Yoqdi' },
  { type: 'LAUGH', emoji: '😂', label: 'Kulgili' },
  { type: 'THUMBS_UP', emoji: '👍', label: 'Zo\'r' },
  { type: 'CRY', emoji: '😢', label: 'Ta\'sirlandim' },
  { type: 'FIRE', emoji: '🔥', label: 'Olov' },
];
export const emojiOf = (type) => REACTIONS.find((r) => r.type === type)?.emoji || '❤️';

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'hozirgina';
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} kun oldin`;
  return null; // sana ko'rsatiladi
}

export const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export function monthYear(iso) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
