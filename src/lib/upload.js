import { api } from './api.js';

// Cloudinary'ga to'g'ridan-to'g'ri yuklash (backend imzo beradi).
// onProgress(0..100) chaqiriladi. Natija: { url, thumb, duration, type }
export async function uploadToCloud(file, onProgress) {
  const sig = await api.get('/uploads/signature');
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const result = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', sig.uploadUrl);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(json);
        else reject(new Error(json?.error?.message || 'Yuklashda xatolik'));
      } catch { reject(new Error('Yuklashda xatolik')); }
    };
    xhr.onerror = () => reject(new Error("Yuklab bo'lmadi. Internetni tekshiring."));
    xhr.send(form);
  });

  const isVideo = result.resource_type === 'video';
  const url = result.secure_url;
  // Cloudinary video uchun .jpg qo'ysangiz, birinchi kadr rasmi chiqadi
  const thumb = isVideo
    ? url.replace('/upload/', '/upload/so_0,w_640,c_fill,ar_16:9/').replace(/\.[a-z0-9]+$/i, '.jpg')
    : url.replace('/upload/', '/upload/c_fill,w_480,q_auto,f_auto/');
  return { url, thumb, duration: Math.round(result.duration || 0), type: isVideo ? 'video' : 'image' };
}

// Katta rasmni optimallashtirilgan ko'rinishda ko'rsatish
export function optimize(url, w = 900) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (url.includes('/upload/c_') || url.includes('/upload/w_') || url.includes('/upload/so_')) return url;
  return url.replace('/upload/', `/upload/w_${w},q_auto,f_auto/`);
}
