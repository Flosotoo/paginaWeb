export interface TarjetaResumenProps {
  etiqueta: string;
  valor: string | number;
  detalle?: string;
  destacado?: boolean;
}

export function TarjetaResumen({
  etiqueta,
  valor,
  detalle,
  destacado = false,
}: TarjetaResumenProps) {
  return (
    <article
      className={`edusaldo-kpi-card h-100 p-3 rounded-4 d-flex flex-column justify-content-between ${
        destacado ? "edusaldo-kpi-highlight" : ""
      }`}
    >
      <span className="edusaldo-kpi-label">{etiqueta}</span>
      <strong className="edusaldo-kpi-value my-1">{valor}</strong>
      {detalle && <small className="edusaldo-kpi-detail">{detalle}</small>}
    </article>
  );
}
