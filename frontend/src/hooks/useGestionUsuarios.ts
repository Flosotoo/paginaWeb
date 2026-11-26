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

type Credencial = { nombre: string; identificador: string; clave: string };

function credencialesFamilia(r: AltaAlumnoRespuesta): Credencial[] {
  const lista: Credencial[] = [];
  if (r.tempPasswordApoderado) lista.push({ nombre: r.nombreApoderado, identificador: r.correoApoderado ?? r.rutApoderado, clave: r.tempPasswordApoderado });
  if (r.tempPasswordAlumno) lista.push({ nombre: r.nombreAlumno, identificador: r.correoAlumno ?? r.rutAlumno, clave: r.tempPasswordAlumno });
  return lista;
}

export function useGestionUsuarios() {
  const { usuario } = useSesion();
  const [aviso, setAviso] = useState("");
  const [credenciales, setCredenciales] = useState<Credencial[]>([]);
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
      if (creado.tempPassword) setCredenciales(prev => [...prev, { nombre: creado.nombreCompleto, identificador: creado.correo, clave: creado.tempPassword! }]);
      const { tempPassword: _clave, ...datosPublicos } = creado;
      return {
        mensaje: `Cuenta registrada: ${creado.nombreCompleto} (${creado.rut}).`,
        datos: datosPublicos,
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
      setCredenciales(prev => [...prev, ...credencialesFamilia(resp)]);
      const { tempPasswordAlumno: _al, tempPasswordApoderado: _ap, ...datosPublicos } = resp;
      return {
        mensaje: `Alumno registrado: ${resp.nombreAlumno} (${resp.rutAlumno}).`,
        datos: datosPublicos,
      };
    });

  const importar = (filas: Omit<AltaAlumno, "idEstablecimiento">[]) =>
    ejecutar(async () => {
      const resultados = await importarNomina(
        filas.map((fila) => ({
          ...fila,
          idEstablecimiento: usuario!.idEstablecimiento,
        })),
      );
      setCredenciales(prev => [...prev, ...resultados.flatMap(credencialesFamilia)]);
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
      const u = usuarios.datos?.find(v => v.id === id);
      setCredenciales(prev => [...prev.filter(c => c.identificador !== (u?.correo ?? String(id))), { nombre: u?.nombreCompleto ?? `Usuario #${id}`, identificador: u?.correo ?? String(id), clave: r.tempPassword }]);
      return { mensaje: "Contraseña temporal generada." };
    });

  return {
    usuarios,
    credenciales,
    cerrarCredenciales: () => setCredenciales([]),
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
