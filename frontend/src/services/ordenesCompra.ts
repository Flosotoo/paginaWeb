
import { api } from "./api";

export type EstadoOrdenCompra =
  | "PENDIENTE_APROBACION"
  | "APROBADA"
  | "RECIBIDA";

export interface DetalleOrdenCompra {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface OrdenCompra {
  id: number;
  id_establecimiento: number;
  proveedor_id: number;
  creada_por: number;
  aprobada_por: number | null;
  fecha_creacion: string;
  fecha_aprobacion: string | null;
  estado: EstadoOrdenCompra;
  observacion: string | null;
  total_neto: number;
  iva: number;
  total: number;
  detalles?: DetalleOrdenCompra[];
}

export interface CrearOrdenCompra {
  proveedorId: number;
  observacion: string;
  detalles: {
    productoId: number;
    cantidad: number;
    precioUnitario: number;
  }[];
}

const BASE = "/api/ordenes-compra";

export const ordenesCompraService = {
  async listar(): Promise<OrdenCompra[]> {
    const respuesta = await api.get<OrdenCompra[]>(BASE);
    return respuesta.data;
  },

  async obtener(id: number): Promise<OrdenCompra> {
    const respuesta = await api.get<OrdenCompra>(
      `${BASE}/${id}`
    );
    return respuesta.data;
  },

  async crear(datos: CrearOrdenCompra): Promise<OrdenCompra> {
    const respuesta = await api.post<OrdenCompra>(
      BASE,
      datos
    );
    return respuesta.data;
  },

  async aprobar(id: number): Promise<OrdenCompra> {
    const respuesta = await api.patch<OrdenCompra>(
      `${BASE}/${id}/aprobar`
    );
    return respuesta.data;
  },

  async recepcionar(id: number): Promise<OrdenCompra> {
    const respuesta = await api.patch<OrdenCompra>(
      `${BASE}/${id}/recepcionar`
    );
    return respuesta.data;
  },
};
