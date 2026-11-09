import { useCallback, useState } from "react";
import { useSesion } from "../context/SesionContext";
import { useAccion } from "./useAccion";
import { useConsulta } from "./useConsulta";
import { mensajeError } from "../services/api";
import { privacidadService } from "../services/privacidad";
export const VERSION_AVISO = "1.0";
export function usePrivacidad() {
  const { usuario } = useSesion();
  const { procesando, realizar } = useAccion();
  const [aviso, setAviso] = useState("");
  const [usuarioConsultado, setUsuarioConsultado] = useState<number | null>(
    null,
  );
  const idConsulta =
    usuario?.rol === "ADMINISTRADOR" && usuarioConsultado
      ? usuarioConsultado
      : (usuario?.usuarioId ?? 0);
  const consultar = useCallback(
    () => privacidadService.listar(idConsulta),
    [idConsulta],
  );
  const historial = useConsulta(consultar, !!usuario && idConsulta > 0);
  const aceptar = async () => {
    setAviso("");
    try {
      await realizar(async () => {
        await privacidadService.aceptar(usuario!.usuarioId, VERSION_AVISO);
        setAviso("Aceptación registrada.");
        await historial.recargar();
      });
    } catch (e) {
      setAviso(mensajeError(e));
    }
  };
  return {
    usuario,
    usuarioConsultado,
    setUsuarioConsultado,
    procesando,
    aviso,
    historial,
    aceptar,
  };
}
