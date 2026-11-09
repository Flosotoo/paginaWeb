import { useCallback, useState } from "react";
import { useAccion } from "./useAccion";
import { useConsulta } from "./useConsulta";
import {
  vinculosService,
  type DatosAlumnoActualizados,
} from "../services/usuarios";
import { mensajeError } from "../services/api";
export function useVinculos(recargarUsuarios?: () => Promise<unknown>) {
  const [alumno, setAlumno] = useState(0);
  const [aviso, setAviso] = useState("");
  const { procesando, realizar } = useAccion();
  const consultar = useCallback(() => vinculosService.listar(alumno), [alumno]);
  const vinculos = useConsulta(consultar, alumno > 0);
  const ejecutar = async (accion: () => Promise<unknown>, mensaje: string) => {
    setAviso("");
    try {
      await realizar(async () => {
        await accion();
        setAviso(mensaje);
        await vinculos.recargar();
        await recargarUsuarios?.();
      });
    } catch (e) {
      setAviso(mensajeError(e));
    }
  };
  const vincular = (apoderado: number, parentesco: string) =>
    ejecutar(
      () => vinculosService.vincular(alumno, apoderado, parentesco),
      "Vínculo registrado.",
    );
  const desvincular = (apoderado: number, motivo: string) =>
    ejecutar(
      () => vinculosService.desvincular(alumno, apoderado, motivo),
      "Vínculo desactivado.",
    );
  const actualizarCurso = (
    curso: string,
    adicionales?: Omit<DatosAlumnoActualizados, "curso">,
  ) =>
    ejecutar(
      () => vinculosService.actualizarCurso(alumno, curso, adicionales),
      "Curso actualizado.",
    );
  return {
    alumno,
    setAlumno,
    aviso,
    procesando,
    vinculos,
    vincular,
    desvincular,
    actualizarCurso,
  };
}
