const MAX_INPUT_LENGTH = 32;

function normalizarEntradaBasica(valor: string | null | undefined): string {
  return String(valor ?? "")
    .trim()
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .toUpperCase();
}

function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

/** Elimina separadores visuales para comparaciones y búsquedas tolerantes. */
export function limpiarRut(valor: string | null | undefined): string {
  return normalizarEntradaBasica(valor).replace(/[.\-\s]/g, "");
}

/**
 * Valida y retorna la forma canónica `cuerpo-DV` (ej. `12345678-5`), o `null` si el
 * valor incumple formato, rango oficial o algoritmo Módulo 11.
 */
export function normalizarRutCanonicamente(
  valor: string | null | undefined,
): string | null {
  const normalizado = normalizarEntradaBasica(valor);
  if (!normalizado || normalizado.length > MAX_INPUT_LENGTH) return null;
  if (!/^[0-9K.\-\s]+$/.test(normalizado)) return null;

  const sinEspacios = normalizado.replace(/\s+/g, "");
  if (sinEspacios.includes("..")) return null;

  let cuerpoRaw: string;
  let dv: string;

  if (sinEspacios.includes("-")) {
    if (
      !/^(?:[0-9]{7,9}|[0-9]{1,2}\.[0-9]{3}\.[0-9]{3})-[0-9K]$/.test(sinEspacios)
    ) {
      return null;
    }
    const guion = sinEspacios.indexOf("-");
    cuerpoRaw = sinEspacios.slice(0, guion).replace(/\./g, "");
    dv = sinEspacios.slice(guion + 1);
  } else {
    if (
      !/^(?:[0-9]{7,9}|[0-9]{1,2}\.[0-9]{3}\.[0-9]{3})[0-9K]$/.test(sinEspacios)
    ) {
      return null;
    }
    const compacto = sinEspacios.replace(/\./g, "");
    cuerpoRaw = compacto.slice(0, -1);
    dv = compacto.slice(-1);
  }

  const numero = Number(cuerpoRaw);
  if (!Number.isSafeInteger(numero) || numero < 1_000_000 || numero > 99_999_999) {
    return null;
  }

  const cuerpo = String(numero);
  const esperado = calcularDigitoVerificador(cuerpo);
  if (esperado !== dv) return null;

  return `${cuerpo}-${esperado}`;
}

export function rutEsValido(valor: string | null | undefined): boolean {
  return normalizarRutCanonicamente(valor) !== null;
}

/** Retorna un mensaje específico para feedback inmediato en formularios, o `""` si es válido. */
export function mensajeErrorRut(valor: string | null | undefined): string {
  const normalizado = normalizarEntradaBasica(valor);
  if (!normalizado) return "Ingresa el RUT.";
  if (normalizado.length > MAX_INPUT_LENGTH) {
    return "El RUT ingresado excede el largo permitido.";
  }
  if (!/^[0-9K.\-\s]+$/.test(normalizado)) {
    return "El RUT solo puede contener números, puntos, guion y dígito verificador (0-9 o K).";
  }

  const sinEspacios = normalizado.replace(/\s+/g, "");
  if (sinEspacios.includes("..")) {
    return "El formato de puntos del RUT no es válido.";
  }

  const compacto = sinEspacios.replace(/[.\-]/g, "");
  if (compacto.includes("K") && !compacto.endsWith("K")) {
    return "La letra K solo puede ir al final como dígito verificador.";
  }

  let cuerpoRaw: string;
  let dv: string;
  if (sinEspacios.includes("-")) {
    if (
      !/^(?:[0-9]{7,9}|[0-9]{1,2}\.[0-9]{3}\.[0-9]{3})-[0-9K]$/.test(sinEspacios)
    ) {
      return "Formato de RUT inválido. Ejemplo: 12.345.678-5.";
    }
    const guion = sinEspacios.indexOf("-");
    cuerpoRaw = sinEspacios.slice(0, guion).replace(/\./g, "");
    dv = sinEspacios.slice(guion + 1);
  } else {
    if (
      !/^(?:[0-9]{7,9}|[0-9]{1,2}\.[0-9]{3}\.[0-9]{3})[0-9K]$/.test(sinEspacios)
    ) {
      return "Formato de RUT inválido. Ejemplo: 12.345.678-5.";
    }
    cuerpoRaw = compacto.slice(0, -1);
    dv = compacto.slice(-1);
  }

  const numero = Number(cuerpoRaw);
  if (!Number.isSafeInteger(numero) || numero < 1_000_000 || numero > 99_999_999) {
    return "El RUT está fuera de rango (debe tener 7 u 8 dígitos antes del dígito verificador).";
  }

  const cuerpo = String(numero);
  if (calcularDigitoVerificador(cuerpo) !== dv) {
    return "El dígito verificador del RUT no es válido.";
  }

  return "";
}

/** Formatea visualmente `12345678-5` como `12.345.678-5` si es válido; de lo contrario conserva el valor. */
export function formatearRutVisual(valor: string): string {
  const canonico = normalizarRutCanonicamente(valor);
  if (!canonico) return valor;
  const [cuerpo, dv] = canonico.split("-");
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv}`;
}

/** Comprueba coincidencia parcial o exacta de RUT ignorando puntos, guiones y espacios. */
export function coincideRut(
  rutRegistrado: string | null | undefined,
  consulta: string | null | undefined,
): boolean {
  const limpioRegistrado = limpiarRut(rutRegistrado);
  const limpioConsulta = limpiarRut(consulta);
  if (!limpioRegistrado || !limpioConsulta) return false;
  return limpioRegistrado.includes(limpioConsulta);
}
