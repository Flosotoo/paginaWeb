import { api } from "./api";
export interface Usuario {
  id: number;
  rut: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
  estado: string;
}
export interface NuevoUsuario {
  idEstablecimiento: number;
  rut: string;
  primerNombre: string;
  primerApellido: string;
  correo: string;
  rol: "ENCARGADO" | "APODERADO";
}
export const usuariosService = {
  async listar() {
    return (await api.get<Usuario[]>("/api/usuarios")).data;
  },
  async crear(datos: NuevoUsuario) {
    return (await api.post<Usuario>("/api/usuarios", datos)).data;
  },
  async inactivar(id: number) {
    await api.put(`/api/usuarios/${id}/inactivar`);
  },
  async reactivar(id: number) {
    await api.put(`/api/usuarios/${id}/reactivar`);
  },
  async restablecer(id: number) {
    return (
      await api.post<{ tempPassword: string }>(
        `/api/usuarios/${id}/reset-password`,
      )
    ).data;
  },
};
export interface AltaAlumno {
  idEstablecimiento: number;
  rutAlumno: string;
  primerNombreAlumno: string;
  primerApellidoAlumno: string;
  fechaNacimiento: string;
  curso: string;
  rutApoderado: string;
  primerNombreApoderado: string;
  primerApellidoApoderado: string;
  correoApoderado: string;
  parentesco: "PADRE" | "MADRE" | "TUTOR_LEGAL" | "OTRO";
}
export async function registrarAlumno(datos: AltaAlumno) {
  return (await api.post("/api/usuarios/alumnos", datos)).data;
}
export interface Vinculo {
  id: number;
  nombreCompleto: string;
  parentesco: string;
  activo: boolean;
  fechaDesvinculacion: string | null;
  motivoDesvinculacion: string | null;
}
export interface DatosAlumnoActualizados {
  curso: string;
  primerNombre?: string;
  primerApellido?: string;
  rut?: string;
  fechaNacimiento?: string;
}
export const vinculosService = {
  async actualizarCurso(
    alumno: number,
    curso: string,
    adicionales?: Omit<DatosAlumnoActualizados, "curso">,
  ) {
    return (
      await api.put(`/api/usuarios/alumnos/${alumno}/curso`, {
        curso,
        ...adicionales,
      })
    ).data;
  },
  async listar(alumno: number) {
    return (
      await api.get<Vinculo[]>(`/api/usuarios/alumnos/${alumno}/apoderados`, {
        params: { incluirInactivos: true },
      })
    ).data;
  },
  async vincular(alumno: number, apoderado: number, parentesco: string) {
    return (
      await api.post(
        `/api/usuarios/alumnos/${alumno}/apoderados/${apoderado}`,
        null,
        { params: { parentesco } },
      )
    ).data;
  },
  async desvincular(alumno: number, apoderado: number, motivo: string) {
    return (
      await api.delete(
        `/api/usuarios/alumnos/${alumno}/apoderados/${apoderado}`,
        { params: { motivo } },
      )
    ).data;
  },
};
export async function importarNomina(datos: AltaAlumno[]) {
  return (await api.post('/api/usuarios/alumnos/importacion-masiva', datos)).data;
}
