import { api } from "./api";
export interface Alumno {
  id: number;
  nombreCompleto: string;
  rut: string;
  curso: string;
}
export interface Cuenta {
  saldoActual: number;
  saldoComprometido: number;
  saldoDisponible: number;
}
export interface NotificacionSaldo {
  id: number;
  alumnoId: number;
  estado: string;
  contenido: string | null;
}
export interface MovimientoSaldo {
  id: number;
  tipo: string;
  monto: number;
  saldoResultante: number;
  fecha: string;
  descripcion: string;
}
export interface Abono {
  id: number;
  idEstablecimiento: number;
  alumnoId: number;
  apoderadoId: number;
  monto: number;
  medioPago: string;
  estado: string;
  fechaCreacion: string;
}
export const familiaService = {
  async abonos(alumnoId?: number) {
    return (
      await api.get<Abono[]>("/api/saldos/abonos", {
        params: alumnoId ? { alumnoId } : {},
      })
    ).data;
  },
  async notificaciones() {
    return (await api.get<NotificacionSaldo[]>("/api/saldos/notificaciones"))
      .data;
  },
  async alumnos(apoderadoId: number) {
    return (
      await api.get<Alumno[]>(`/api/usuarios/apoderados/${apoderadoId}/alumnos`)
    ).data;
  },
  async cuenta(alumnoId: number) {
    return (await api.get<Cuenta>(`/api/saldos/cuenta/${alumnoId}`)).data;
  },
  async movimientos(alumnoId: number) {
    return (
      await api.get<MovimientoSaldo[]>(
        `/api/saldos/cuenta/${alumnoId}/movimientos`,
      )
    ).data;
  },
  async iniciarAbono(alumnoId: number, apoderadoId: number, monto: number) {
    return (
      await api.post<{ token: string }>("/api/saldos/abonos/iniciar", {
        alumnoId,
        apoderadoId,
        monto,
      })
    ).data;
  },
  async confirmarAbono(
    token: string,
    resultadoSimulado: "APROBADO" | "RECHAZADO",
  ) {
    return (
      await api.post("/api/saldos/abonos/confirmar", {
        token,
        resultadoSimulado,
      })
    ).data;
  },
};
