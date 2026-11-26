import { api } from "./api";
import { inventarioService, type CostoMovimiento } from "./inventario";
type ItemCosto = { productoId: number; cantidad: number };

export interface ResumenCuentaLibreria {
  costoVentas?: number | null;
  motivoCosto?: string;
  totalAbonadoPeriodo?: number;
  totalEntregasPeriodo?: number;
  totalReintegrosDevolucion?: number;
  totalCuentas?: number;
  totalSaldoActual?: number;
  totalSaldoComprometido?: number;
  totalSaldoDisponible?: number;
}

export interface AbonoLibreria {
  id: number;
  alumnoId: number;
  monto: number;
  estado: string;
  medioPago: string;
  fechaCreacion: string;
}

export interface EntregaLibreria {
  items?: ItemCosto[];
  id: number;
  numero: string;
  alumnoId: number;
  fecha: string;
  total: number;
  origen: string;
  estadoOperacion: string;
}

export interface DevolucionLibreria {
  items?: ItemCosto[];
  id: number;
  codigoDevolucion: string;
  entregaId: number;
  alumnoId: number;
  fecha: string;
  totalReintegro: number;
  estadoOperacion: string;
}

export interface MovimientoLibreria {
  clave: string;
  fecha: string;
  tipo: "ABONO" | "VENTA" | "DEVOLUCION";
  referencia: string;
  alumnoId: number;
  detalle: string;
  monto: number;
}

export const cuentaLibreriaService = {
  async consultar(desde: string, hasta: string) {
    const [resumen, abonos, entregas, devoluciones, costos] = await Promise.all([
      api.get<ResumenCuentaLibreria>("/api/saldos/reportes/resumen-periodo", { params: { desde, hasta } }),
      api.get<AbonoLibreria[]>("/api/saldos/abonos", { params: { estado: "APROBADO" } }),
      api.get<EntregaLibreria[]>("/api/entregas/historial"),
      api.get<DevolucionLibreria[]>("/api/devoluciones"),
      inventarioService.costosVentas().catch(() => null),
    ]);
    const enPeriodo = (fecha: string) => {
      const dia = fecha?.slice(0, 10);
      return Boolean(dia && dia >= desde && dia <= hasta);
    };
    const movimientos: MovimientoLibreria[] = [
      ...abonos.data.filter((a) => a.estado === "APROBADO" && enPeriodo(a.fechaCreacion)).map((a) => ({
        clave: `abono-${a.id}`, fecha: a.fechaCreacion, tipo: "ABONO" as const,
        referencia: `ABO-${a.id}`, alumnoId: a.alumnoId,
        detalle: `Abono acreditado · ${a.medioPago || "Medio no indicado"}`, monto: a.monto,
      })),
      ...entregas.data.filter((e) => e.estadoOperacion === "COMPLETADA" && enPeriodo(e.fecha)).map((e) => ({
        clave: `entrega-${e.id}`, fecha: e.fecha, tipo: "VENTA" as const,
        referencia: e.numero || `ENT-${e.id}`, alumnoId: e.alumnoId,
        detalle: `Entrega ${e.origen || ""}`.trim(), monto: e.total,
      })),
      ...devoluciones.data.filter((d) => d.estadoOperacion === "COMPLETADA" && enPeriodo(d.fecha)).map((d) => ({
        clave: `devolucion-${d.id}`, fecha: d.fecha, tipo: "DEVOLUCION" as const,
        referencia: d.codigoDevolucion || `DEV-${d.id}`, alumnoId: d.alumnoId,
        detalle: `Reintegro de entrega ${d.entregaId}`, monto: -d.totalReintegro,
      })),
    ].sort((a, b) => b.fecha.localeCompare(a.fecha));
    const ventas = entregas.data.filter(e => e.estadoOperacion === "COMPLETADA" && enPeriodo(e.fecha));
    const reintegros = devoluciones.data.filter(d => d.estadoOperacion === "COMPLETADA" && enPeriodo(d.fecha));
    const sumar = (items: ItemCosto[] | undefined, lineas: CostoMovimiento[]): number | null => {
      if (!items?.length || !lineas.length) return null;
      const cantidades = new Map<number, number>();
      for (const item of items) cantidades.set(item.productoId, (cantidades.get(item.productoId) ?? 0) + item.cantidad);
      let total = 0;
      for (const linea of lineas) {
        if (linea.costoTotal == null || linea.costoTotal === "" || !Number.isFinite(Number(linea.costoTotal)) || Number(linea.costoTotal) < 0 || !cantidades.has(linea.productoId)) return null;
        cantidades.set(linea.productoId, cantidades.get(linea.productoId)! - linea.cantidad);
        total += Number(linea.costoTotal);
      }
      return [...cantidades.values()].every(c => c === 0) ? total : null;
    };
    let costoVentas: number | null = costos === null ? null : 0;
    if (costos !== null) {
      for (const e of ventas) {
        const lineas = costos.filter(c => c.tipo === "ENTREGA" && c.entregaId === e.id);
        const compensada = costos.some(c => c.tipo === "COMPENSACION" && c.entregaId === e.id);
        const costo = compensada ? null : sumar(e.items, lineas);
        costoVentas = costoVentas === null || costo === null ? null : costoVentas + costo;
      }
      for (const d of reintegros) {
        const costo = sumar(d.items, costos.filter(c => c.tipo === "DEVOLUCION" && c.devolucionId === d.id && c.entregaId === d.entregaId));
        costoVentas = costoVentas === null || costo === null ? null : costoVentas - costo;
      }
    }
    const totalVentas = ventas.reduce((n, e) => n + e.total, 0);
    const totalReintegros = reintegros.reduce((n, d) => n + d.totalReintegro, 0);
    const coincide = totalVentas === resumen.data.totalEntregasPeriodo && totalReintegros === resumen.data.totalReintegrosDevolucion;
    if (!coincide) costoVentas = null;
    const motivoCosto = costos === null ? "No se pudo consultar el costo de ventas." : !coincide ? "Ventas y saldos no coinciden para el período." : "Hay operaciones sin costo histórico completo.";
    return { resumen: { ...resumen.data, costoVentas, motivoCosto }, movimientos };
  },
};
