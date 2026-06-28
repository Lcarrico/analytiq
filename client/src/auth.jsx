import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in

  useEffect(() => {
    api.authMe().then(u => setUser(u || null)).catch(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    const u = await api.authLogin({ email, password });
    setUser(u);
    return u;
  };

  const register = async (email, name, password) => {
    const u = await api.authRegister({ email, name, password });
    setUser(u);
    return u;
  };

  const logout = async () => {
    await api.authLogout();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
