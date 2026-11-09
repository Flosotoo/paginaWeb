import { api } from "./api";
export interface Consentimiento {
  id: number;
  usuarioId: number;
  versionAviso: string;
  fechaAceptacion: string;
}
export const privacidadService = {
  async listar(usuarioId: number) {
    return (
      await api.get<Consentimiento[]>(
        `/api/consentimiento/usuario/${usuarioId}`,
      )
    ).data;
  },
  async aceptar(usuarioId: number, versionAviso: string) {
    return (await api.post("/api/consentimiento", { usuarioId, versionAviso }))
      .data;
  },
};
