import { useState } from "react";

export function CancelacionReserva({ procesando, cancelar }: {
  procesando: boolean;
  cancelar: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); void cancelar(motivo.trim()); }}>
      <label>Motivo de cancelación
        <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} required />
      </label>
      <button className="btn" disabled={procesando || !motivo.trim()}>Cancelar</button>
    </form>
  );
}
