import { useState } from "react";

export type TipoAlerta = "exito" | "error" | "aviso" | "info";

export interface AlertaMensajeProps {
  mensaje: string;
  tipo?: TipoAlerta;
  descartable?: boolean;
  onCerrar?: () => void;
}

const CLASE_ALERTA: Record<TipoAlerta, string> = {
  exito: "alert-success",
  error: "alert-danger",
  aviso: "alert-warning",
  info: "alert-info",
};

const ICONO_ALERTA: Record<TipoAlerta, string> = {
  exito: "✓",
  error: "⚠",
  aviso: "!",
  info: "ℹ",
};

export function AlertaMensaje({
  mensaje,
  tipo = "info",
  descartable = false,
  onCerrar,
}: AlertaMensajeProps) {
  const [oculta, setOculta] = useState(false);

  if (!mensaje || oculta) {
    return null;
  }

  const cerrar = () => {
    setOculta(true);
    onCerrar?.();
  };

  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`alert ${CLASE_ALERTA[tipo]} edusaldo-alert d-flex align-items-center justify-content-between gap-2 my-2`}
    >
      <div className="d-flex align-items-center gap-2">
        <span aria-hidden="true" className="fw-bold">
          {ICONO_ALERTA[tipo]}
        </span>
        <span>{mensaje}</span>
      </div>
      {(descartable || onCerrar) && (
        <button
          type="button"
          className="btn-close"
          aria-label="Cerrar aviso"
          onClick={cerrar}
        />
      )}
    </div>
  );
}
