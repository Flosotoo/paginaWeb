import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';

interface RutaProtegidaProps {
  children: React.ReactNode;
  /** Roles autorizados. Si se omite, basta con tener sesión iniciada. */
  roles?: UserRole[];
}

/**
 * Guarda de ruta por sesión y por rol.
 *
 * IMPORTANTE: esto es protección de UX (evita que un rol vea pantallas de otro
 * rol al navegar por URL). NO es seguridad real: la autorización efectiva vivirá
 * en el backend cuando se implemente JWT. El claim `rol` del token será la fuente
 * de verdad; aquí solo se consume `user.role` del contexto.
 */
export const RutaProtegida: React.FC<RutaProtegidaProps> = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const destino =
      user.role === 'libreria'
        ? '/libreria'
        : user.role === 'administrador'
        ? '/admin'
        : user.role === 'autorizador'
        ? '/autorizador'
        : '/';
    return <Navigate to={destino} replace />;
  }

  return <>{children}</>;
};
