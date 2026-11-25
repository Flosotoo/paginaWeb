// Tabla estándar Code 128 (símbolos 0..106): mayúscula = barra, minúscula = espacio; A/a=1 .. D/d=4 módulos.
const PATRONES_CODE128: readonly string[] = [
  "BaBbBb", "BbBaBb", "BbBbBa", "AbAbBc", "AbAcBb", "AcAbBb", "AbBbAc", "AbBcAb", "AcBbAb", "BbAbAc",
  "BbAcAb", "BcAbAb", "AaBbCb", "AbBaCb", "AbBbCa", "AaCbBb", "AbCaBb", "AbCbBa", "BbCbAa", "BbAaCb",
  "BbAbCa", "BaCbAb", "BbCaAb", "CaBaCa", "CaAbBb", "CbAaBb", "CbAbBa", "CaBbAb", "CbBaAb", "CbBbAa",
  "BaBaBc", "BaBcBa", "BcBaBa", "AaAcBc", "AcAaBc", "AcAcBa", "AaBcAc", "AcBaAc", "AcBcAa", "BaAcAc",
  "BcAaAc", "BcAcAa", "AaBaCc", "AaBcCa", "AcBaCa", "AaCaBc", "AaCcBa", "AcCaBa", "CaCaBa", "BaAcCa",
  "BcAaCa", "BaCaAc", "BaCcAa", "BaCaCa", "CaAaBc", "CaAcBa", "CcAaBa", "CaBaAc", "CaBcAa", "CcBaAa",
  "CaDaAa", "BbAdAa", "DcAaAa", "AaAbBd", "AaAdBb", "AbAaBd", "AbAdBa", "AdAaBb", "AdAbBa", "AaBbAd",
  "AaBdAb", "AbBaAd", "AbBdAa", "AdBaAb", "AdBbAa", "BdAbAa", "BbAaAd", "DaCaAa", "BdAaAb", "AcDaAa",
  "AaAbDb", "AbAaDb", "AbAbDa", "AaDbAb", "AbDaAb", "AbDbAa", "DaAbAb", "DbAaAb", "DbAbAa", "BaBaDa",
  "BaDaBa", "DaBaBa", "AaAaDc", "AaAcDa", "AcAaDa", "AaDaAc", "AaDcAa", "DaAaAc", "DaAcAa", "AaCaDa",
  "AaDaCa", "CaAaDa", "DaAaCa", "BaAdAb", "BaAbAd", "BaAbCb", "BcCaAaB",
];

const START_CODE_B = 104;
const STOP_CODE = 106;

const ENTIDADES_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ENTIDADES_HTML[c] ?? c);
}

/**
 * Genera un SVG Code 128 B autocontenido (sin dependencias externas).
 * Retorna null si el texto está vacío o contiene caracteres fuera de ASCII imprimible (32..126).
 */
export function generarSvgCode128B(texto: string): string | null {
  if (!texto || !/^[ -~]+$/.test(texto)) return null;

  const valores = Array.from(texto, (c) => c.charCodeAt(0) - 32);
  const checksum =
    (START_CODE_B + valores.reduce((suma, v, i) => suma + v * (i + 1), 0)) %
    103;

  let x = 10;
  let barras = "";
  for (const simbolo of [START_CODE_B, ...valores, checksum, STOP_CODE]) {
    for (const modulo of PATRONES_CODE128[simbolo]) {
      const ancho = modulo.toUpperCase().charCodeAt(0) - 64;
      if (modulo === modulo.toUpperCase()) {
        barras += `<rect x="${x}" y="0" width="${ancho}" height="64"/>`;
      }
      x += ancho;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 10} 64" preserveAspectRatio="none" fill="black" shape-rendering="crispEdges">${barras}</svg>`;
}

export interface DatosEtiquetaBolsa {
  codigo: string;
  nombreAlumno: string;
  curso: string;
  totalMateriales: number;
}

export function construirHtmlEtiquetaBolsa({
  codigo,
  nombreAlumno,
  curso,
  totalMateriales,
}: DatosEtiquetaBolsa): string | null {
  const svg = generarSvgCode128B(codigo);
  if (!svg) return null;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Etiqueta EduSaldo</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 12px; }
    .etiqueta { width: 160mm; max-width: 100%; box-sizing: border-box; border: 1px dashed #555; padding: 4mm; }
    h1 { font-size: 20px; margin: 4px 0; }
    p { margin: 4px 0; }
    svg { display: block; width: 100%; height: 18mm; }
    small { display: block; overflow-wrap: anywhere; font-size: 10px; }
    button { margin-top: 12px; padding: 8px; }
    @media print { button { display: none; } body { margin: 0; } }
  </style>
</head>
<body>
  <div class="etiqueta">
    <strong>EduSaldo · Retiro de materiales</strong>
    <h1>${escaparHtml(nombreAlumno)}</h1>
    <p>${escaparHtml(curso || "Curso no disponible")} · ${totalMateriales} materiales</p>
    ${svg}
    <small>${escaparHtml(codigo)}</small>
  </div>
  <button onclick="window.print()">Imprimir etiqueta</button>
</body>
</html>`;
}
