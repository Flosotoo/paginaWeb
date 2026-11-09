import { api } from './api';
export interface LiquidacionResultado { alumnoId: number; apoderadoId: number; montoLiquidado: number; saldoActual: number; movimientoId: number; }
export async function liquidarSaldo(alumnoId: number, apoderadoId: number, medio: string, comprobante: string, motivo: string) {
  return (await api.post<LiquidacionResultado>('/api/saldos/liquidar-retiro', { alumnoId, apoderadoId, medio, comprobante, motivo })).data;
}
