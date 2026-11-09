export function exportarCsv(
  nombre: string,
  encabezados: string[],
  filas: (string | number)[][],
) {
  const celda = (valor: string | number) => {
    const texto = String(valor);
    const seguro =
      typeof valor === "string" && /^[=+\-@\t\r]/.test(texto)
        ? "'" + texto
        : texto;
    return '"' + seguro.replaceAll('"', '""') + '"';
  };
  const csv = [encabezados, ...filas]
    .map((fila) => fila.map(celda).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
  );
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
