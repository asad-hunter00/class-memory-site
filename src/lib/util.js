import { useEffect, useState, useCallback, useRef } from 'react';

export const REACTIONS = [
  { type: 'HEART', emoji: '❤️', label: 'Yoqdi' },
  { type: 'LAUGH', emoji: '😂', label: 'Kulgili' },
  { type: 'THUMBS_UP', emoji: '👍', label: 'Zo\'r' },
  { type: 'CRY', emoji: '😢', label: 'Yig\'latdi' },
  { type: 'FIRE', emoji: '🔥', label: 'Olov' },
];
export const emojiOf = (t) => REACTIONS.find((r) => r.type === t)?.emoji;

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
export const monthName = (i) => MONTHS[i];
export function monthYear(iso) { const d = new Date(iso); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

export function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'hozirgina';
  const m = Math.floor(s / 60); if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24); if (d < 30) return `${d} kun oldin`;
  return null; // sana ko'rsatiladi
}
export function whenText(item) {
  const ago = timeAgo(item?.createdAt);
  return ago || `${item?.dateFormatted ?? ''}`;
}

export function fmtDuration(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtDateTimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Oddiy ma'lumot yuklovchi hook
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const alive = useRef(true);
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try { const data = await fn(); if (alive.current) setState({ loading: false, data, error: null }); }
    catch (e) { if (alive.current) setState({ loading: false, data: null, error: e.message || 'Xatolik' }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { alive.current = true; run(); return () => { alive.current = false; }; }, [run]);
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function fmtDateLocal(iso) { const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`; }
