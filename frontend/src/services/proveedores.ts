import { api } from "./api";

export type EstadoProveedor = "ACTIVO" | "INACTIVO";

export interface Proveedor {
  id: number;
  idEstablecimiento: number;
  razonSocial: string;
  rut: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  contacto: string | null;
  banco: string | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  estado: EstadoProveedor;
}

export type DatosProveedor = Pick<Proveedor, "razonSocial" | "rut" | "telefono" | "correo" | "direccion" | "contacto" | "banco" | "tipoCuenta" | "numeroCuenta">;

const BASE = "/api/proveedores";

export const proveedoresService = {
  async listar(): Promise<Proveedor[]> {
    const respuesta = await api.get<Proveedor[]>(BASE);
    return respuesta.data;
  },
  async crear(datos: DatosProveedor): Promise<Proveedor> {
    const respuesta = await api.post<Proveedor>(BASE, datos);
    return respuesta.data;
  },
  async actualizar(id: number, datos: DatosProveedor): Promise<Proveedor> {
    const respuesta = await api.put<Proveedor>(`${BASE}/${id}`, datos);
    return respuesta.data;
  },
  async cambiarEstado(id: number, activar: boolean): Promise<Proveedor> {
    const respuesta = await api.patch<Proveedor>(`${BASE}/${id}/${activar ? "activar" : "desactivar"}`);
    return respuesta.data;
  },
};
