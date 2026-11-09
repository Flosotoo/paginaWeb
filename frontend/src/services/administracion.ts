import { api } from "./api";
import type { Cuenta, MovimientoSaldo } from "./familia";
export interface Configuracion {
  nombreEstablecimiento: string;
  nombreLibreria: string;
  correoContacto: string;
  logoUrl: string | null;
}
export interface Politica {
  maxIntentosFallidos: number;
  minutosBloqueo: number;
  edadMinimaAlumno: number;
  umbralSaldoBajoClp: number;
}
export interface Auditoria {
  id: number;
  fechaHora: string;
  usuarioId: number | null;
  accion: string;
  entidad: string;
  entidadId: string;
  detalle: string;
}
export interface ConstanciaAuditada {
  id: number;
  alumnoId: number;
  administradorId: number;
  montoClp: number;
  fecha: string;
}
export type Resumen = Record<string, number>;
export interface ReporteCuenta {
  cuenta: Cuenta & { alumnoId: number; idEstablecimiento: number };
  movimientos: MovimientoSaldo[];
}
export const administracionService = {
  async configuracion() {
    return (await api.get<Configuracion>("/api/configuracion")).data;
  },
  async guardarConfiguracion(datos: Configuracion) {
    return (await api.put("/api/configuracion", datos)).data;
  },
  async politica() {
    return (await api.get<Politica>("/api/politica-acceso")).data;
  },
  async guardarPolitica(datos: Politica) {
    return (await api.put("/api/politica-acceso", datos)).data;
  },
  async auditoria() {
    return (await api.get<Auditoria[]>("/api/auditoria")).data;
  },
  async constancias() {
    return (await api.get<ConstanciaAuditada[]>("/api/saldos/constancias")).data;
  },
  async resumen(desde: string, hasta: string) {
    return (
      await api.get<Resumen>("/api/saldos/reportes/resumen-periodo", {
        params: { desde, hasta },
      })
    ).data;
  },
  async cuentas(desde: string, hasta: string) {
    return (await api.get<ReporteCuenta[]>("/api/saldos/reportes/cuentas", {
      params: { desde, hasta },
    })).data;
  },
};
