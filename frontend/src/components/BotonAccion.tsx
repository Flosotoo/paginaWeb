import type { ReactNode } from "react";
import { useAccion } from "../hooks/useAccion";

export interface BotonAccionProps {
  texto: string;
  textoProcesando?: string;
  variante?: "primario" | "secundario";
  type?: "button" | "submit";
  disabled?: boolean;
  ocupadoExterno?: boolean;
  className?: string;
  icono?: ReactNode;
  onClick?: () => Promise<void> | void;
}

export function BotonAccion({
  texto,
  textoProcesando = "Procesando…",
  variante = "primario",
  type = "button",
  disabled = false,
  ocupadoExterno = false,
  className = "",
  icono,
  onClick,
}: BotonAccionProps) {
  const { procesando, realizar } = useAccion();
  const bloqueado = disabled || ocupadoExterno || procesando;
  const enCurso = ocupadoExterno || procesando;

  const manejarClick = () => {
    if (!onClick || bloqueado) return;
    void realizar(async () => {
      await onClick();
    });
  };

  return (
    <button
      type={type}
      className={`btn ${variante === "secundario" ? "secondary" : ""} d-inline-flex align-items-center gap-2 ${className}`.trim()}
      disabled={bloqueado}
      aria-busy={enCurso}
      onClick={type === "button" ? manejarClick : undefined}
    >
      {enCurso ? (
        <>
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          />
          <span>{textoProcesando}</span>
        </>
      ) : (
        <>
          {icono && <span aria-hidden="true">{icono}</span>}
          <span>{texto}</span>
        </>
      )}
    </button>
  );
}
