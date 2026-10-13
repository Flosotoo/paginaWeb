import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'apoderado' | 'libreria' | 'administrador' | 'autorizador';

export interface SessionUser {
  name: string;
  role: UserRole;
  mail: string;
  initial: string;
}

interface AuthContextType {
  user: SessionUser | null;
  login: (mail: string, pass: string) => { success: boolean; message?: string; role?: UserRole };
  logout: () => void;
  setRoleSimulado: (role: UserRole) => void;
}

const DEMO_USERS: Record<string, SessionUser & { pass: string }> = {
  'apoderado@edusaldo.cl': {
    name: 'Carlos Pérez',
    role: 'apoderado',
    mail: 'apoderado@edusaldo.cl',
    initial: 'CP',
    pass: '1234',
  },
  'encargado@edusaldo.cl': {
    name: 'Encargado',
    role: 'libreria',
    mail: 'encargado@edusaldo.cl',
    initial: 'E',
    pass: '1234',
  },
  'admin@edusaldo.cl': {
    name: 'Administrador 1',
    role: 'administrador',
    mail: 'admin@edusaldo.cl',
    initial: 'A',
    pass: '1234',
  },
  'admin2@edusaldo.cl': {
    name: 'Administrador 2',
    role: 'autorizador',
    mail: 'admin2@edusaldo.cl',
    initial: 'A',
    pass: '1234',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KEY = 'edusaldo2_sesion';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      return saved ? JSON.parse(saved) : DEMO_USERS['apoderado@edusaldo.cl'];
    } catch {
      return DEMO_USERS['apoderado@edusaldo.cl'];
    }
  });

  const login = (mail: string, pass: string) => {
    const cleanMail = mail.trim().toLowerCase();
    const candidate = DEMO_USERS[cleanMail];

    if (!candidate || candidate.pass !== pass) {
      return { success: false, message: 'Revisa el correo y la contraseña.' };
    }

    const sessionData: SessionUser = {
      name: candidate.name,
      role: candidate.role,
      mail: candidate.mail,
      initial: candidate.initial,
    };

    sessionStorage.setItem(KEY, JSON.stringify(sessionData));
    setUser(sessionData);

    return { success: true, role: candidate.role };
  };

  const logout = () => {
    sessionStorage.removeItem(KEY);
    setUser(null);
  };

  const setRoleSimulado = (role: UserRole) => {
    const targetMail = Object.keys(DEMO_USERS).find((k) => DEMO_USERS[k].role === role);
    if (targetMail) {
      const candidate = DEMO_USERS[targetMail];
      const sessionData: SessionUser = {
        name: candidate.name,
        role: candidate.role,
        mail: candidate.mail,
        initial: candidate.initial,
      };
      sessionStorage.setItem(KEY, JSON.stringify(sessionData));
      setUser(sessionData);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setRoleSimulado }}>
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
