import { useCallback, useState } from "react";
import { useSesion } from "../context/SesionContext";
import { useAccion } from "./useAccion";
import { useConsulta } from "./useConsulta";
import {
  importarNomina,
  registrarAlumno,
  usuariosService,
  type AltaAlumno,
  type NuevoUsuario,
} from "../services/usuarios";
import { mensajeError } from "../services/api";
export function useGestionUsuarios() {
  const { usuario } = useSesion();
  const [aviso, setAviso] = useState("");
  const { realizar, procesando } = useAccion();
  const cargar = useCallback(() => usuariosService.listar(), []);
  const usuarios = useConsulta(cargar);
  const ejecutar = async (accion: () => Promise<string>) => {
    setAviso("");
    try {
      await realizar(async () => {
        setAviso(await accion());
        await usuarios.recargar();
      });
    } catch (e) {
      setAviso(mensajeError(e));
    }
  };
  const crear = (datos: Omit<NuevoUsuario, "idEstablecimiento">) =>
    ejecutar(async () => {
      await usuariosService.crear({
        ...datos,
        idEstablecimiento: usuario!.idEstablecimiento,
      });
      return "Usuario creado.";
    });
  const crearAlumno = (datos: Omit<AltaAlumno, "idEstablecimiento">) =>
    ejecutar(async () => {
      await registrarAlumno({
        ...datos,
        idEstablecimiento: usuario!.idEstablecimiento,
      });
      return "Alumno y vínculo registrados.";
    });
  const importar = (filas: Omit<AltaAlumno, "idEstablecimiento">[]) =>
    ejecutar(async () => {
      await importarNomina(filas.map(fila => ({ ...fila, idEstablecimiento: usuario!.idEstablecimiento })));
      return `Nómina importada: ${filas.length} alumnos.`;
    });
  const inactivar = (id: number) =>
    ejecutar(async () => {
      await usuariosService.inactivar(id);
      return "Usuario inactivado.";
    });
  const reactivar = (id: number) =>
    ejecutar(async () => {
      await usuariosService.reactivar(id);
      return "Usuario reactivado.";
    });
  const restablecer = (id: number) =>
    ejecutar(async () => {
      const r = await usuariosService.restablecer(id);
      return `Contraseña temporal: ${r.tempPassword}`;
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
