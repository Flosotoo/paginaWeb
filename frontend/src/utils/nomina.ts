import Papa from 'papaparse';
import type { AltaAlumno } from '../services/usuarios';
export type FilaNomina = Omit<AltaAlumno, 'idEstablecimiento'>;
const columnas: (keyof FilaNomina)[] = ['rutAlumno', 'primerNombreAlumno', 'primerApellidoAlumno', 'fechaNacimiento', 'curso', 'rutApoderado', 'primerNombreApoderado', 'primerApellidoApoderado', 'correoApoderado', 'parentesco'];
export function interpretarNomina(texto: string): FilaNomina[] {
  const resultado = Papa.parse<Record<string, string>>(texto, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
  if (resultado.errors.length) throw new Error(`CSV inválido en fila ${(resultado.errors[0].row ?? 0) + 2}: ${resultado.errors[0].message}`);
  const faltan = columnas.filter(c => !resultado.meta.fields?.includes(c));
  if (faltan.length) throw new Error(`Faltan columnas: ${faltan.join(', ')}`);
  if (!resultado.data.length) throw new Error('La nómina está vacía.');
  return resultado.data.map((fila, indice) => {
    const limpia = Object.fromEntries(columnas.map(c => [c, (fila[c] ?? '').trim()])) as unknown as FilaNomina;
    const incompleta = columnas.find(c => !limpia[c]);
    if (incompleta) throw new Error(`Fila ${indice + 2}: falta ${incompleta}.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(limpia.fechaNacimiento)) throw new Error(`Fila ${indice + 2}: fecha inválida; usa AAAA-MM-DD.`);
    if (!['PADRE', 'MADRE', 'TUTOR_LEGAL', 'OTRO'].includes(limpia.parentesco)) throw new Error(`Fila ${indice + 2}: parentesco inválido.`);
    return limpia;
  });
}
