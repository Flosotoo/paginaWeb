import { api } from "./api";
export type Rol = "ADMINISTRADOR" | "ENCARGADO" | "APODERADO" | "ALUMNO";
export interface Sesion {
  token: string;
  usuarioId: number;
  idEstablecimiento: number;
  rut: string;
  nombreCompleto: string;
  correo: string;
  rol: Rol | `ROLE_${Rol}`;
  estado: string;
}
export const authService = {
  async solicitarRecuperacion(correo: string) {
    return (await api.post("/api/auth/recuperar-password", { correo })).data;
  },
  async confirmarRecuperacion(token: string, nuevaPassword: string) {
    return (
      await api.post("/api/auth/confirmar-recuperacion", {
        token,
        nuevaPassword,
      })
    ).data;
  },
  async correosSimulados() {
    return (
      await api.get<
        {
          id: number;
          destinatario: string;
          tipo: string;
          contenido: string;
          fechaCreacion: string;
        }[]
      >("/api/auth/correos-simulados")
    ).data;
  },
  async login(identificador: string, password: string) {
    return (
      await api.post<Sesion>("/api/auth/login", { identificador, password })
    ).data;
  },
  async sesion() {
    return (await api.get("/api/auth/sesion")).data;
  },
  async logout() {
    await api.post("/api/auth/cerrar-sesion");
  },
  async cambiarPassword(
    identificador: string,
    passwordActual: string,
    passwordNueva: string,
  ) {
    return api.post("/api/auth/cambiar-password", {
      identificador,
      passwordActual,
      passwordNueva,
    });
  },
};
