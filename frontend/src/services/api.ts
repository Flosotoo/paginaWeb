import axios from "axios";

let sessionToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

function resolverApiBaseUrl(): string {
  try {
    const meta = import.meta as unknown as {
      env?: Record<string, string | undefined>;
    };
    if (meta?.env?.VITE_API_BASE_URL) {
      return meta.env.VITE_API_BASE_URL;
    }
  } catch {
    // Entorno fuera de Vite (p. ej. Karma/Webpack) usa el Gateway local por defecto.
  }
  return "http://localhost:8090";
}

export const api = axios.create({
  baseURL: resolverApiBaseUrl(),
  timeout: 15000,
});

export function setSessionToken(token: string | null) {
  sessionToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (sessionToken) config.headers.Authorization = `Bearer ${sessionToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      // Ignoramos el 401 propio de credenciales incorrectas al iniciar sesión o al cerrar sesión.
      if (
        sessionToken &&
        !url.includes("/api/auth/login") &&
        !url.includes("/api/auth/cerrar-sesion")
      ) {
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);

export function mensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
    if (!error.response)
      return "No se pudo conectar con el servidor. Inténtalo nuevamente.";
  }
  return "No se pudo completar la solicitud.";
}
