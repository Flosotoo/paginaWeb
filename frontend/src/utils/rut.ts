// Validación y normalización de RUT/RUN chileno (Módulo 11).
// Portado desde la versión vanilla (assets/js/validaciones.js) para recuperar
// la validación que se había perdido en el SPA.

export function normalizarRut(valor: string | null | undefined): string {
  return String(valor == null ? '' : valor)
    .replace(/[.\-\s]/g, '')
    .toUpperCase();
}

// Módulo 11 chileno: lo único del RUN que no se puede validar con HTML.
function digitoVerificadorValido(cuerpo: string, dv: string): boolean {
  if (!/^[0-9]+$/.test(cuerpo)) return false;
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const calculado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return calculado === dv;
}

// RUN tolerante: acepta con o sin puntos, con o sin guion, con o sin dígito
// verificador, y con K minúscula o mayúscula.
export function rutEsValido(valor: string): boolean {
  const run = normalizarRut(valor);
  if (run.length < 6 || run.length > 9) return false;
  if (!/^[0-9K]+$/.test(run)) return false;
  if (run.includes('K') && !run.endsWith('K')) return false;

  const cuerpo = run.slice(0, -1);
  const dv = run.slice(-1);

  // 1) Venía con dígito verificador: se comprueba.
  if (/^[0-9]+$/.test(cuerpo) && digitoVerificadorValido(cuerpo, dv)) {
    return true;
  }

  // 2) No venía dígito verificador: se acepta si el cuerpo tiene 6 a 8 dígitos.
  if (/^[0-9]+$/.test(run) && run.length >= 6 && run.length <= 8) {
    return true;
  }

  return false;
}

export function mensajeRut(valor: string): string {
  const run = normalizarRut(valor);
  if (run === '') return 'Ingresa el RUT.';
  if (!/^[0-9K]+$/.test(run)) {
    return 'El RUT solo puede contener números y la letra K.';
  }
  if (run.includes('K') && !run.endsWith('K')) {
    return 'La letra K solo puede ir al final como dígito verificador.';
  }
  if (run.length < 6 || run.length > 9) {
    return 'El RUT debe tener entre 6 y 9 caracteres.';
  }
  return rutEsValido(run) ? '' : 'El dígito verificador del RUT no es válido.';
}

// Compara dos RUT ignorando formato (puntos, guion, espacios, mayúsculas).
export function mismoRut(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizarRut(a);
  const nb = normalizarRut(b);
  return na !== '' && na === nb;
}
