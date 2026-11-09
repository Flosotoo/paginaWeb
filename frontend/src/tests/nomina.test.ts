import { describe, expect, it } from 'vitest';
import { interpretarNomina } from '../utils/nomina';
const cabecera = 'rutAlumno;primerNombreAlumno;primerApellidoAlumno;fechaNacimiento;curso;rutApoderado;primerNombreApoderado;primerApellidoApoderado;correoApoderado;parentesco';
describe('nómina CSV', () => {
  it('interpreta campos citados y conserva cada vínculo', () => {
    const filas = interpretarNomina(cabecera + '\n11111111-1;Ana;Pérez;2014-01-10;"5;A";12345678-5;Carlos;Pérez;c@example.org;PADRE');
    expect(filas).toHaveLength(1); expect(filas[0].curso).toBe('5;A'); expect(filas[0].parentesco).toBe('PADRE');
  });
  it('identifica la fila sin datos obligatorios', () => {
    expect(() => interpretarNomina(cabecera + '\n11111111-1;Ana;Pérez;2014-01-10;;12345678-5;Carlos;Pérez;c@example.org;PADRE')).toThrow(/fila 2/i);
  });
  it('rechaza columnas ausentes y CSV malformado', () => {
    expect(() => interpretarNomina('rutAlumno;curso\n11111111-1;4A')).toThrow(/columnas/i);
    expect(() => interpretarNomina(cabecera + '\n"sin cerrar')).toThrow();
  });
});
