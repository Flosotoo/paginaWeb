import { api } from "./api";

export interface ResumenCuentaLibreria {
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
  id: number;
  numero: string;
  alumnoId: number;
  fecha: string;
  total: number;
  origen: string;
  estadoOperacion: string;
}

export interface DevolucionLibreria {
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
    const [resumen, abonos, entregas, devoluciones] = await Promise.all([
      api.get<ResumenCuentaLibreria>("/api/saldos/reportes/resumen-periodo", { params: { desde, hasta } }),
      api.get<AbonoLibreria[]>("/api/saldos/abonos", { params: { estado: "APROBADO" } }),
      api.get<EntregaLibreria[]>("/api/entregas/historial"),
      api.get<DevolucionLibreria[]>("/api/devoluciones"),
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
    return { resumen: resumen.data, movimientos };
  },
};
