import { useCallback, useState } from "react";
import { useSesion } from "../context/SesionContext";
import { useAccion } from "./useAccion";
import { useConsulta } from "./useConsulta";
import { mensajeError } from "../services/api";
import { correccionesService } from "../services/correcciones";
export function useCorrecciones() {
  const { usuario } = useSesion();
  const [aviso, setAviso] = useState("");
  const { procesando, realizar } = useAccion();
  const consultar = useCallback(() => correccionesService.listar(), []);
  const solicitudes = useConsulta(consultar);
  const ejecutar = async (accion: () => Promise<unknown>, mensaje: string) => {
    setAviso("");
    try {
      await realizar(async () => {
        await accion();
        setAviso(mensaje);
        await solicitudes.recargar();
      });
    } catch (e) {
      setAviso(mensajeError(e));
    }
  };
  const crear = (campo: string, valor: string, motivo: string) =>
    ejecutar(
      () =>
        correccionesService.crear(
          usuario!.usuarioId,
          usuario!.idEstablecimiento,
          campo,
          valor,
          motivo,
        ),
      "Solicitud registrada.",
    );
  const resolver = (id: number, aprobar: boolean) =>
    ejecutar(
      () =>
        correccionesService.resolver(
          id,
          aprobar,
          aprobar
            ? "Aprobada por administración"
            : "Rechazada por administración",
        ),
      aprobar ? "Solicitud aprobada." : "Solicitud rechazada.",
    );
  return { usuario, aviso, procesando, solicitudes, crear, resolver };
}
