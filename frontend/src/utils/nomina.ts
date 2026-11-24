import Papa from 'papaparse';
import type { AltaAlumno } from '../services/usuarios';
import { mensajeErrorRut, normalizarRutCanonicamente } from './rut';

export type FilaNomina = Omit<AltaAlumno, 'idEstablecimiento'>;
const columnas: (keyof FilaNomina)[] = ['rutAlumno', 'primerNombreAlumno', 'primerApellidoAlumno', 'fechaNacimiento', 'curso', 'rutApoderado', 'primerNombreApoderado', 'primerApellidoApoderado', 'correoApoderado', 'parentesco'];

function validarFechaNacimientoIso(valor: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return 'fecha inválida; usa AAAA-MM-DD.';
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return 'la fecha de nacimiento no existe en el calendario.';
  }
  const hoy = new Date();
  const hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  if (valor > hoyIso) return 'la fecha de nacimiento no puede ser futura.';
  if (anio < 1900) return 'la fecha de nacimiento está fuera de un rango válido.';
  return '';
}

export function interpretarNomina(texto: string): FilaNomina[] {
  const resultado = Papa.parse<Record<string, string>>(texto, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
  if (resultado.errors.length) throw new Error(`CSV inválido en fila ${(resultado.errors[0].row ?? 0) + 2}: ${resultado.errors[0].message}`);
  const faltan = columnas.filter(c => !resultado.meta.fields?.includes(c));
  if (faltan.length) throw new Error(`Faltan columnas: ${faltan.join(', ')}`);
  if (!resultado.data.length) throw new Error('La nómina está vacía.');
  return resultado.data.map((fila, indice) => {
    const numFila = indice + 2;
    const limpia = Object.fromEntries(columnas.map(c => [c, (fila[c] ?? '').trim()])) as unknown as FilaNomina;
    const incompleta = columnas.find(c => !limpia[c]);
    if (incompleta) throw new Error(`Fila ${numFila}: falta ${incompleta}.`);
    const rutAlumnoCanonico = normalizarRutCanonicamente(limpia.rutAlumno);
    if (!rutAlumnoCanonico) throw new Error(`Fila ${numFila}: RUT de alumno inválido (${mensajeErrorRut(limpia.rutAlumno)})`);
    const rutApoderadoCanonico = normalizarRutCanonicamente(limpia.rutApoderado);
    if (!rutApoderadoCanonico) throw new Error(`Fila ${numFila}: RUT de apoderado inválido (${mensajeErrorRut(limpia.rutApoderado)})`);
    if (rutAlumnoCanonico === rutApoderadoCanonico) {
      throw new Error(`Fila ${numFila}: el RUT del alumno y del apoderado no pueden ser iguales.`);
    }
    const errFecha = validarFechaNacimientoIso(limpia.fechaNacimiento);
    if (errFecha) throw new Error(`Fila ${numFila}: ${errFecha}`);
    if (!['PADRE', 'MADRE', 'TUTOR_LEGAL', 'OTRO'].includes(limpia.parentesco)) throw new Error(`Fila ${numFila}: parentesco inválido.`);
    return {
      ...limpia,
      rutAlumno: rutAlumnoCanonico,
      rutApoderado: rutApoderadoCanonico,
    };
  });
}
