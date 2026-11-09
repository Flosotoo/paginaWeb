import { familiaService } from "../services/familia";
import { usuariosService } from "../services/usuarios";
import { useCallback, useEffect, useState } from "react";
import { useConsulta } from "./useConsulta";
import { useAccion } from "./useAccion";
import {
  administracionService,
  type Configuracion,
  type Politica,
  type Resumen,
  type ReporteCuenta,
} from "../services/administracion";
import { mensajeError } from "../services/api";
export function useAdministracion() {
  const { realizar, procesando } = useAccion();
  const [aviso, setAviso] = useState("");
  const cargarAbonos = useCallback(() => familiaService.abonos(), []);
  const abonos = useConsulta(cargarAbonos);
  const cargarConfig = useCallback(
    () => administracionService.configuracion(),
    [],
  );
  const configuracion = useConsulta(cargarConfig);
  const cargarPolitica = useCallback(
    () => administracionService.politica(),
    [],
  );
  const politica = useConsulta(cargarPolitica);
  const cargarAuditoria = useCallback(
    () => administracionService.auditoria(),
    [],
  );
  const auditoria = useConsulta(cargarAuditoria);
  const cargarConstancias = useCallback(() => administracionService.constancias(), []);
  const constancias = useConsulta(cargarConstancias);
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [reglas, setReglas] = useState<Politica | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [reporte, setReporte] = useState<{ desde: string; hasta: string; cuentas: ReporteCuenta[]; nombres: Record<number, string> } | null>(null);
  useEffect(() => {
    setConfig(configuracion.datos);
  }, [configuracion.datos]);
  useEffect(() => {
    setReglas(politica.datos);
  }, [politica.datos]);
  const ejecutar = async (accion: () => Promise<void>, mensaje: string) => {
    setAviso("");
    try {
      await realizar(async () => {
        await accion();
        setAviso(mensaje);
      });
    } catch (e) {
      setAviso(mensajeError(e));
    }
  };
  const guardarConfig = () =>
    ejecutar(async () => {
      if (config) {
        await administracionService.guardarConfiguracion(config);
        await configuracion.recargar();
      }
    }, "Configuración actualizada.");
  const guardarReglas = () =>
    ejecutar(async () => {
      if (reglas) {
        await administracionService.guardarPolitica(reglas);
        await politica.recargar();
      }
    }, "Política actualizada.");
  const consultarResumen = (desde: string, hasta: string) =>
    ejecutar(async () => {
      setResumen(null);
      setReporte(null);
      const [resumenConsultado, cuentas, usuarios] = await Promise.all([
        administracionService.resumen(desde, hasta),
        administracionService.cuentas(desde, hasta),
        usuariosService.listar(),
      ]);
      setResumen(resumenConsultado);
      setReporte({ desde, hasta, cuentas, nombres: Object.fromEntries(usuarios.map((u) => [u.id, u.nombreCompleto])) });
    }, "Reporte consultado.");
  return {
    abonos,
    configuracion,
    politica,
    auditoria,
    constancias,
    config,
    setConfig,
    reglas,
    setReglas,
    resumen,
    reporte,
    aviso,
    procesando,
    guardarConfig,
    guardarReglas,
    consultarResumen,
  };
}
