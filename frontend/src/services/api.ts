import axios from "axios";

let sessionToken: string | null = null;
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090",
  timeout: 15000,
});
export function setSessionToken(token: string | null) {
  sessionToken = token;
}
api.interceptors.request.use((config) => {
  if (sessionToken) config.headers.Authorization = `Bearer ${sessionToken}`;
  return config;
});
export function mensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
    if (!error.response)
      return "No se pudo conectar con el servidor. Inténtalo nuevamente.";
  }
  return "No se pudo completar la solicitud.";
}
