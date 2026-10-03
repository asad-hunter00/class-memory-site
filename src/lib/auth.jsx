import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api.js';
import { connectSocket, disconnectSocket } from './socket.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => { setToken(null); disconnectSocket(); setUser(null); }, []);

  const refresh = useCallback(async () => {
    const me = await api.get('/auth/me');
    setUser(me?.user ?? me);
    return me;
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    (async () => {
      if (getToken()) { try { await refresh(); connectSocket(); } catch { logout(); } }
      setReady(true);
    })();
  }, [logout, refresh]);

  const login = async (username, password) => {
    const data = await api.post('/auth/login', { username: username.trim().toLowerCase(), password });
    setToken(data.token);
    setUser(data.user);
    connectSocket();
    refresh().catch(() => {});
  };

  return <AuthCtx.Provider value={{ user, ready, login, logout, refresh, isAdmin: user?.role === 'ADMIN' }}>{children}</AuthCtx.Provider>;
}
