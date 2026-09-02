import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { apiError } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wallet_tracker_user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('wallet_tracker_token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('wallet_tracker_token')));

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/profile');
        setUser(data.user);
        localStorage.setItem('wallet_tracker_user', JSON.stringify(data.user));
      } catch {
        localStorage.removeItem('wallet_tracker_token');
        localStorage.removeItem('wallet_tracker_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('wallet_tracker_token', data.token);
    localStorage.setItem('wallet_tracker_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password, currency) => {
    const { data } = await api.post('/auth/register', { name, email, password, currency });
    localStorage.setItem('wallet_tracker_token', data.token);
    localStorage.setItem('wallet_tracker_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const resetPassword = useCallback(async (email, code, password) => {
    const { data } = await api.post('/auth/reset-password', { email, code, password });
    localStorage.setItem('wallet_tracker_token', data.token);
    localStorage.setItem('wallet_tracker_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const socialLogin = useCallback(async (provider, token) => {
    const { data } = await api.post('/auth/social', { provider, token });
    localStorage.setItem('wallet_tracker_token', data.token);
    localStorage.setItem('wallet_tracker_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wallet_tracker_token');
    localStorage.removeItem('wallet_tracker_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('wallet_tracker_user', JSON.stringify(updated));
  }, []);

  const value = useMemo(() => ({
    user, token, loading, login, register, socialLogin, resetPassword, logout, updateUser,
  }), [user, token, loading, login, register, socialLogin, resetPassword, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  return ctx || { user: null, token: null, loading: false, login: async () => {}, register: async () => {}, socialLogin: async () => {}, resetPassword: async () => {}, logout: () => {}, updateUser: () => {} };
};

export { apiError };
