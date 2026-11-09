import { api } from "./api";
export interface Ajuste {
  id: number;
  productoId: number;
  cantidad: number;
  motivo: string;
  estado: string;
  encargadoId: number;
}
export interface MovimientoInventario { id: number; nombreProducto: string; tipo: string; variacionFisica: number; variacionReservada: number; stockResultante: number; fecha: string; responsableId: number | null; }
export const inventarioService = {
  async movimientos() { return (await api.get<MovimientoInventario[]>('/api/inventario/movimientos')).data; },
  async ajustes() {
    return (await api.get<Ajuste[]>("/api/inventario/ajustes")).data;
  },
  async solicitar(
    productoId: number,
    cantidad: number,
    motivo: string,
    encargadoId: number,
  ) {
    return (
      await api.post("/api/inventario/ajustes/solicitar", {
        productoId,
        cantidad,
        motivo,
        encargadoId,
      })
    ).data;
  },
  async aprobar(id: number, administradorId: number) {
    return (
      await api.post(`/api/inventario/ajustes/${id}/aprobar`, {
        administradorId,
      })
    ).data;
  },
  async rechazar(id: number, motivoRechazo: string, administradorId: number) {
    return (
      await api.post(`/api/inventario/ajustes/${id}/rechazar`, {
        motivoRechazo,
        administradorId,
      })
    ).data;
  },
};
