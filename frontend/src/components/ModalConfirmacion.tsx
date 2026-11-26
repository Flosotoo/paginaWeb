import { useEffect, useId, useRef, useState } from "react";
import "./modalConfirmacion.css";

export interface SolicitudConfirmacion {
  titulo: string;
  mensaje: string;
  detalle?: string;
  accion: string;
  motivo?: boolean;
  advertencia?: boolean;
  ejecutar: (motivo: string) => unknown;
}

export function ModalConfirmacion({ solicitud, cerrar }: {
  solicitud: SolicitudConfirmacion;
  cerrar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const ocupado = useRef(false);
  const [procesando, setProcesando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const tituloId = useId();
  const mensajeId = useId();
  useEffect(() => {
    const el = dialogo.current;
    if (el && !el.open) el.showModal();
    return () => { if (el?.open) el.close(); };
  }, []);
  async function confirmar() {
    if (ocupado.current || (solicitud.motivo && !motivo.trim())) return;
    ocupado.current = true;
    setProcesando(true);
    setError("");
    try {
      await solicitud.ejecutar(motivo.trim());
      cerrar();
    } catch {
      setError("No se pudo completar la operación. Revisa el estado antes de volver a intentarlo.");
    } finally {
      ocupado.current = false;
      setProcesando(false);
    }
  }
  return (
    <dialog ref={dialogo} className="edu-confirmacion" aria-labelledby={tituloId} aria-describedby={mensajeId}
      onCancel={(e) => { e.preventDefault(); if (!ocupado.current) cerrar(); }}>
      <header className="edu-confirmacion-titulo"><span aria-hidden="true">{solicitud.advertencia ? "!" : "✓"}</span><h2 id={tituloId}>{solicitud.titulo}</h2></header>
      <p id={mensajeId}>{solicitud.mensaje}</p>
      {solicitud.detalle && <p className="edu-confirmacion-detalle">{solicitud.detalle}</p>}
      {solicitud.motivo && <label className="edu-confirmacion-motivo">Motivo del rechazo *<textarea className="input" rows={4} value={motivo} disabled={procesando} onChange={(e) => setMotivo(e.target.value)} required /></label>}
      {error && <p role="alert" className="form-feedback error">{error}</p>}
      <div className="edu-confirmacion-acciones">
        <button type="button" className="btn secondary" autoFocus disabled={procesando} onClick={cerrar}>Cancelar</button>
        <button type="button" className={`btn ${solicitud.advertencia ? "edu-confirmacion-advertencia" : ""}`} disabled={procesando || Boolean(solicitud.motivo && !motivo.trim())} onClick={() => void confirmar()}>{procesando ? "Procesando…" : solicitud.accion}</button>
      </div>
    </dialog>
  );
}
