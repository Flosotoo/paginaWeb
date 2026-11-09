import { api } from "./api";
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  sku: string;
  precio: number;
  stockFisico: number;
  stockReservado: number;
  stockDisponible: number;
  stockCritico: number;
  categoriaId: number;
  categoria: string;
  estado: string;
}
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
}
export const catalogoService = {
  async criticos() { return (await api.get<Producto[]>('/api/productos/criticos')).data; },
  async productos() {
    return (await api.get<Producto[]>("/api/productos")).data;
  },
  async categorias() {
    return (await api.get<Categoria[]>("/api/categorias")).data;
  },
};

export interface NuevoProducto {
  categoriaId: number;
  sku: string;
  nombre: string;
  cursoNivel: string;
  precio: number;
  stockInicial: number;
  stockCritico: number;
}
export const administracionCatalogo = {
  async editarProducto(id: number, nombre: string, precio: number) {
    return (await api.put(`/api/productos/${id}`, { nombre, precio })).data;
  },
  async inactivarProducto(id: number) {
    await api.delete(`/api/productos/${id}`);
  },
  async editarCategoria(id: number, nombre: string, descripcion: string) {
    return (await api.put(`/api/categorias/${id}`, { nombre, descripcion }))
      .data;
  },
  async inactivarCategoria(id: number) {
    await api.delete(`/api/categorias/${id}`);
  },
  async contar(
    productoId: number,
    stockContado: number,
    encargadoId: number,
    idEstablecimiento: number,
  ) {
    return (
      await api.post("/api/inventario/conteos-fisicos", {
        encargadoId,
        idEstablecimiento,
        detalles: [{ productoId, stockContado }],
      })
    ).data;
  },
  async crearCategoria(nombre: string) {
    return (
      await api.post<Categoria>("/api/categorias", { nombre, descripcion: "" })
    ).data;
  },
  async crearProducto(datos: NuevoProducto) {
    return (await api.post<Producto>("/api/productos", datos)).data;
  },
  async ingresarStock(
    productoId: number,
    cantidad: number,
    encargadoId: number,
    observacion: string,
  ) {
    return (
      await api.post("/api/inventario/ingresos-manuales", {
        encargadoId,
        observacion,
        detalles: [{ productoId, cantidad }],
      })
    ).data;
  },
};
