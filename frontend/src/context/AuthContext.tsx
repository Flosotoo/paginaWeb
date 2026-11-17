import React, { createContext, useContext, useState } from 'react';
import { loginRequest } from '../services/authApi';
import type { LoginResult, SessionUser } from '../services/authApi';

// Re-export para que los consumidores sigan importando desde el contexto.
export type { UserRole, SessionUser, EstadoCuenta } from '../services/authApi';

interface AuthContextType {
  user: SessionUser | null;
  /** Inicia sesión con RUT o correo (campo `identificador`). */
  login: (identificador: string, pass: string) => LoginResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KEY = 'edusaldo2_sesion';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      return saved ? (JSON.parse(saved) as SessionUser) : null;
    } catch {
      return null;
    }
  });

  const login = (identificador: string, pass: string): LoginResult => {
    const res = loginRequest(identificador, pass);
    if (res.success && res.user) {
      sessionStorage.setItem(KEY, JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    sessionStorage.removeItem(KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
