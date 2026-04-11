import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../goiAPI';

const NguoiDungContext = createContext(null);

export function NguoiDungProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { user: u, token } = await authApi.login(email, password);
    localStorage.setItem('token', token);
    setUser(u);
    return u;
  };

  const register = async (body) => {
    const { user: u, token } = await authApi.register(body);
    localStorage.setItem('token', token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <NguoiDungContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </NguoiDungContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(NguoiDungContext);
  if (!ctx) throw new Error('useAuth phải dùng trong NguoiDungProvider');
  return ctx;
}
