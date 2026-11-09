import { useCallback, useState } from 'react';
import { useAccion } from './useAccion'; import { useConsulta } from './useConsulta';
import { familiaService } from '../services/familia'; import { vinculosService } from '../services/usuarios';
import { liquidarSaldo } from '../services/liquidacion'; import { mensajeError } from '../services/api';
export function useLiquidacion() {
  const [alumno, setAlumno] = useState(0); const [aviso, setAviso] = useState(''); const { procesando, realizar } = useAccion();
  const consultarCuenta = useCallback(() => familiaService.cuenta(alumno), [alumno]); const cuenta = useConsulta(consultarCuenta, alumno > 0);
  const consultarVinculos = useCallback(() => vinculosService.listar(alumno), [alumno]); const vinculos = useConsulta(consultarVinculos, alumno > 0);
  const liquidar = async (apoderado: number, medio: string, comprobante: string, motivo: string) => {
    setAviso(''); try { await realizar(async () => { const r = await liquidarSaldo(alumno, apoderado, medio, comprobante.trim(), motivo.trim()); setAviso(`Liquidación registrada por $${r.montoLiquidado.toLocaleString('es-CL')}.`); await cuenta.recargar(); }); }
    catch (e) { setAviso(mensajeError(e)); }
  };
  return { alumno, setAlumno, cuenta, vinculos, procesando, aviso, liquidar };
}
