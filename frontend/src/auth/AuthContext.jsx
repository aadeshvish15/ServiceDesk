import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('servicedesk_user') || 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('servicedesk_token')));

  useEffect(() => {
    const token = localStorage.getItem('servicedesk_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => { setUser(data); localStorage.setItem('servicedesk_user', JSON.stringify(data)); })
      .catch(() => { localStorage.removeItem('servicedesk_token'); localStorage.removeItem('servicedesk_user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('servicedesk_token', data.accessToken);
    localStorage.setItem('servicedesk_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    await api.post('/auth/register', payload);
    return login(payload.email, payload.password);
  };

  const logout = () => {
    localStorage.removeItem('servicedesk_token');
    localStorage.removeItem('servicedesk_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
