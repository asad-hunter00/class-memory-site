import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, getToken, setToken, SERVER_URL } from '../api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [theme, setThemeState] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const [toasts, setToasts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [socket, setSocket] = useState(null);
  const [cls, setCls] = useState(null);
  const toastId = useRef(0);

  const toast = useCallback((text, kind = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const setTheme = (t) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch { /* ignore */ }
  };

  const loadUnread = useCallback(async () => {
    try {
      const r = await api.get('/notifications', { limit: 50 });
      setUnread((r.data || []).filter((n) => !n.isRead).length);
    } catch { /* ignore */ }
  }, []);

  const refreshMe = useCallback(async () => {
    const r = await api.get('/auth/me');
    setUser(r.data);
    return r.data;
  }, []);

  // Sahifa ochilganda token bo'lsa — foydalanuvchini tiklash
  useEffect(() => {
    if (!getToken()) return;
    refreshMe()
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, [refreshMe]);

  // Token eskirsa
  useEffect(() => {
    const h = () => { setUser(null); toast('Sessiya tugadi, qayta kiring', 'error'); };
    window.addEventListener('auth:expired', h);
    return () => window.removeEventListener('auth:expired', h);
  }, [toast]);

  // Sinf ma'lumoti + o'qilmagan bildirishnomalar
  useEffect(() => {
    if (!user) return;
    api.get('/classes/current').then((r) => setCls(r.data)).catch(() => {});
    loadUnread();
  }, [user?.id, loadUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket
  useEffect(() => {
    if (!user) { setSocket(null); return; }
    const s = io(SERVER_URL, { auth: { token: getToken() }, transports: ['websocket', 'polling'] });
    s.on('notification', (n) => {
      setUnread((u) => u + 1);
      toast(n?.message || n?.title || 'Yangi bildirishnoma', 'info');
    });
    s.on('new_announcement', (a) => toast(`📢 E'lon: ${a?.title || ''}`, 'info'));
    s.on('time_capsule_unlocked', (c) => toast(`🔓 Vaqt kapsulasi ochildi: ${c?.title || ''}`, 'info'));
    setSocket(s);
    return () => { s.disconnect(); };
  }, [user?.id, toast]);

  const login = async (username, password) => {
    const r = await api.post('/auth/login', { username, password });
    setToken(r.data.token);
    setUser(r.data.user);
    await refreshMe().catch(() => {});
    return r.data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCls(null);
  };

  const value = useMemo(
    () => ({ user, setUser, booting, theme, setTheme, toast, toasts, unread, setUnread, loadUnread, socket, login, logout, refreshMe, cls }),
    [user, booting, theme, toasts, unread, socket, cls, toast, loadUnread, refreshMe]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
