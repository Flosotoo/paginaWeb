import { useCallback, useState } from "react";
import { useSesion } from "../context/SesionContext";
import { useAccion } from "./useAccion";
import { useConsulta } from "./useConsulta";
import {
  importarNomina,
  registrarAlumno,
  usuariosService,
  type AltaAlumno,
  type AltaAlumnoRespuesta,
  type NuevoUsuario,
} from "../services/usuarios";
import { mensajeError } from "../services/api";

export interface ResultadoAccion<T = undefined> {
  ok: boolean;
  mensaje: string;
  datos?: T;
}

export function useGestionUsuarios() {
  const { usuario } = useSesion();
  const [aviso, setAviso] = useState("");
  const { realizar, procesando } = useAccion();
  const cargar = useCallback(() => usuariosService.listar(), []);
  const usuarios = useConsulta(cargar);

  const ejecutar = async <T = undefined>(
    accion: () => Promise<{ mensaje: string; datos?: T }>,
  ): Promise<ResultadoAccion<T>> => {
    setAviso("");
    try {
      let resultado: { mensaje: string; datos?: T } = { mensaje: "" };
      await realizar(async () => {
        resultado = await accion();
        setAviso(resultado.mensaje);
        await usuarios.recargar();
      });
      return { ok: true, mensaje: resultado.mensaje, datos: resultado.datos };
    } catch (e) {
      const mensaje = mensajeError(e);
      setAviso(mensaje);
      return { ok: false, mensaje };
    }
  };

  const crear = (datos: Omit<NuevoUsuario, "idEstablecimiento">) =>
    ejecutar(async () => {
      const creado = await usuariosService.crear({
        ...datos,
        idEstablecimiento: usuario!.idEstablecimiento,
      });
      return {
        mensaje: `Cuenta registrada: ${creado.nombreCompleto} (${creado.rut}).`,
        datos: creado,
      };
    });

  const crearAlumno = (
    datos: Omit<AltaAlumno, "idEstablecimiento">,
  ): Promise<ResultadoAccion<AltaAlumnoRespuesta>> =>
    ejecutar(async () => {
      const resp = await registrarAlumno({
        ...datos,
        idEstablecimiento: usuario!.idEstablecimiento,
      });
      return {
        mensaje: `Alumno matriculado: ${resp.nombreAlumno} (${resp.rutAlumno}).`,
        datos: resp,
      };
    });

  const importar = (filas: Omit<AltaAlumno, "idEstablecimiento">[]) =>
    ejecutar(async () => {
      await importarNomina(
        filas.map((fila) => ({
          ...fila,
          idEstablecimiento: usuario!.idEstablecimiento,
        })),
      );
      return { mensaje: `Nómina importada: ${filas.length} alumnos.` };
    });

  const inactivar = (id: number) =>
    ejecutar(async () => {
      await usuariosService.inactivar(id);
      return { mensaje: "Usuario inactivado." };
    });

  const reactivar = (id: number) =>
    ejecutar(async () => {
      await usuariosService.reactivar(id);
      return { mensaje: "Usuario reactivado." };
    });

  const restablecer = (id: number) =>
    ejecutar(async () => {
      const r = await usuariosService.restablecer(id);
      return { mensaje: `Contraseña temporal: ${r.tempPassword}` };
    });

  return {
    usuarios,
    aviso,
    procesando,
    crear,
    crearAlumno,
    importar,
    inactivar,
    reactivar,
    restablecer,
  };
}
