import { api } from "./api";
export interface ItemReserva {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
export interface Reserva {
  id: number;
  codigo: string;
  alumnoId: number;
  total: number;
  estado: string;
  fechaCreacion: string;
  items: ItemReserva[];
}
export interface AvisoReserva {
  id: number;
  reservaId: number | null;
  alumnoId: number;
  tipoEvento: string;
  asunto: string;
  mensaje: string;
  estado: string;
}
export const reservasService = {
  async notificaciones() {
    return (await api.get<AvisoReserva[]>("/api/reservas/notificaciones")).data;
  },
  async porAlumno(id: number) {
    return (await api.get<Reserva[]>(`/api/reservas/alumno/${id}`)).data;
  },
  async listar() {
    return (await api.get<Reserva[]>("/api/reservas")).data;
  },
  async crear(
    alumnoId: number,
    items: { productoId: number; cantidad: number }[],
  ) {
    return (await api.post<Reserva>("/api/reservas", { alumnoId, items })).data;
  },
  async cancelar(id: number, motivo: string) {
    return (await api.post<Reserva>(`/api/reservas/${id}/cancelar`, { motivo }))
      .data;
  },
  async preparar(id: number) {
    return (await api.post<Reserva>(`/api/reservas/${id}/marcar-lista`))
      .data;
  },
  async entregar(id: number) {
    return (await api.post(`/api/reservas/${id}/entregar`)).data;
  },
};
