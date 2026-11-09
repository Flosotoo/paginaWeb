import { api } from "./api";
export interface AlumnoBuscado {
  id: number;
  rut: string;
  nombreCompleto: string;
  curso: string;
  estado: string;
}
export interface DetalleEntrega {
  id: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  cantidadDevuelta: number;
  precioUnitario: number;
}
export interface Entrega {
  id: number;
  numero: string;
  alumnoId: number;
  total: number;
  fecha: string;
  origen: string;
  encargadoId: number;
  items: DetalleEntrega[];
}
export const entregasService = {
  async historial() { return (await api.get<Entrega[]>('/api/entregas/historial')).data; },
  async buscarAlumno(rut: string) {
    return (
      await api.get<AlumnoBuscado>("/api/usuarios/alumnos/buscar", {
        params: { rut },
      })
    ).data;
  },
  async crear(alumnoId: number, productoId: number, cantidad: number) {
    return (
      await api.post<Entrega>("/api/entregas/meson", {
        alumnoId,
        items: [{ productoId, cantidad }],
      })
    ).data;
  },
  async obtener(id: number) {
    return (await api.get<Entrega>(`/api/entregas/${id}`)).data;
  },
  async devolver(
    entregaId: number,
    detalleEntregaId: number,
    cantidad: number,
    motivo: string,
  ) {
    return (
      await api.post("/api/devoluciones", {
        entregaId,
        motivo,
        items: [{ detalleEntregaId, cantidad }],
      })
    ).data;
  },
};
