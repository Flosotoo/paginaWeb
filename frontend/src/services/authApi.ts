// Adaptador de autenticación.
//
// HOY: resuelve contra usuarios de demostración (mock client-side).
// FUTURO (JWT): este es el ÚNICO archivo a cambiar. `loginRequest` hará
//   fetch a `POST /api/auth/login` del API Gateway con { identificador, password };
//   el token (JWT firmado) vendrá en LoginResult.user.token y el rol/estado se
//   tomarán de la respuesta/claims. El resto de la app ya consume este contrato.

import { normalizarRut } from '../utils/rut';

export type UserRole = 'apoderado' | 'libreria' | 'administrador' | 'autorizador';

export type EstadoCuenta = 'PRIMER_ACCESO' | 'ACTIVA' | 'BLOQUEADA' | 'INACTIVA';

export interface SessionUser {
  token: string | null; // null mientras no exista JWT real
  usuarioId: number;
  name: string;
  role: UserRole;
  mail: string;
  rut: string;
  initial: string;
  estado: EstadoCuenta;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  user?: SessionUser;
}

interface DemoUser extends SessionUser {
  pass: string;
}

// Credenciales de demostración. El backend permite iniciar sesión con RUT O correo
// (campo `identificador`), por eso cada demo incluye ambos.
const DEMO_USERS: DemoUser[] = [
  {
    token: null, usuarioId: 1, name: 'Carlos Pérez', role: 'apoderado',
    mail: 'apoderado@edusaldo.cl', rut: '9.876.543-3', initial: 'CP',
    estado: 'ACTIVA', pass: '1234',
  },
  {
    token: null, usuarioId: 2, name: 'Marta Gómez', role: 'libreria',
    mail: 'encargado@edusaldo.cl', rut: '11.222.333-4', initial: 'MG',
    estado: 'ACTIVA', pass: '1234',
  },
  {
    token: null, usuarioId: 3, name: 'Antonio Jara', role: 'administrador',
    mail: 'admin@edusaldo.cl', rut: '15.666.777-8', initial: 'AJ',
    estado: 'ACTIVA', pass: '1234',
  },
  {
    token: null, usuarioId: 4, name: 'Rodrigo Valdés', role: 'autorizador',
    mail: 'admin2@edusaldo.cl', rut: '16.777.888-9', initial: 'RV',
    estado: 'ACTIVA', pass: '1234',
  },
];

/**
 * Autentica por RUT o correo. Firma equivalente a `POST /api/auth/login`.
 * Cuando exista JWT, reemplazar el cuerpo por un fetch al gateway.
 */
export function loginRequest(identificador: string, password: string): LoginResult {
  const id = identificador.trim();
  const idMail = id.toLowerCase();
  const idRut = normalizarRut(id);

  const candidate = DEMO_USERS.find(
    (u) => u.mail.toLowerCase() === idMail || normalizarRut(u.rut) === idRut
  );

  if (!candidate || candidate.pass !== password) {
    return { success: false, message: 'Revisa tus credenciales (correo o RUT y contraseña).' };
  }
  if (candidate.estado === 'BLOQUEADA') {
    return { success: false, message: 'Tu cuenta está bloqueada. Contacta al administrador.' };
  }
  if (candidate.estado === 'INACTIVA') {
    return { success: false, message: 'Tu cuenta está inactiva.' };
  }

  const user: SessionUser = {
    token: candidate.token,
    usuarioId: candidate.usuarioId,
    name: candidate.name,
    role: candidate.role,
    mail: candidate.mail,
    rut: candidate.rut,
    initial: candidate.initial,
    estado: candidate.estado,
  };
  return { success: true, user };
}

/**
 * Solicitud de recuperación de contraseña (mock).
 * FUTURO: `POST /api/auth/recuperar-password` (el endpoint ya existe en el backend).
 */
export function recuperarPasswordRequest(correo: string): { success: boolean; message: string } {
  const existe = DEMO_USERS.some((u) => u.mail.toLowerCase() === correo.trim().toLowerCase());
  if (!correo.trim()) {
    return { success: false, message: 'Ingresa tu correo para recuperar la contraseña.' };
  }
  // Por privacidad se responde igual exista o no la cuenta.
  return {
    success: true,
    message: existe
      ? 'Si el correo está registrado, enviaremos instrucciones de recuperación.'
      : 'Si el correo está registrado, enviaremos instrucciones de recuperación.',
  };
}
