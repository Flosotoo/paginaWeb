import { api } from "./api";
export interface Correccion {
  id: number;
  usuarioId: number;
  campoSolicitado: string;
  valorPropuesto: string;
  motivo: string;
  estado: string;
}
export const correccionesService = {
  async listar() {
    return (await api.get<Correccion[]>("/api/usuarios/solicitudes-correccion"))
      .data;
  },
  async crear(
    usuarioId: number,
    idEstablecimiento: number,
    campoSolicitado: string,
    valorPropuesto: string,
    motivo: string,
  ) {
    return (
      await api.post<Correccion>("/api/usuarios/solicitudes-correccion", {
        usuarioId,
        idEstablecimiento,
        campoSolicitado,
        valorPropuesto,
        motivo,
      })
    ).data;
  },
  async resolver(id: number, aprobar: boolean, observacion: string) {
    return (
      await api.put<Correccion>(
        `/api/usuarios/solicitudes-correccion/${id}/resolver`,
        { aprobar, observacion },
      )
    ).data;
  },
};
