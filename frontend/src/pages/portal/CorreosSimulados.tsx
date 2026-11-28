import { useCallback } from "react";
import { useConsulta } from "../../hooks/useConsulta";
import { authService } from "../../services/auth";
export function CorreosSimulados() {
  const consultar = useCallback(() => authService.correosSimulados(), []);
  const correos = useConsulta(consultar);
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <span className="eyebrow">BANDEJA DE SALIDA SIMULADA</span>
          <h3 id="correos" style={{ margin: "2px 0 4px" }}>Correos simulados</h3>
          <p className="card-desc" style={{ margin: 0 }}>Estos mensajes son generados por el sistema de notificaciones simulado y no se envían por correo real.</p>
        </div>
        <button type="button" className="btn secondary" disabled={correos.cargando} onClick={() => void correos.recargar()}>
          {correos.cargando ? "Actualizando…" : "Actualizar bandeja"}
        </button>
      </div>
      {correos.error && <p role="alert">{correos.error}</p>}
      {correos.datos?.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No hay mensajes emitidos.</p>}
      <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
        {correos.datos?.map((c) => (
          <article
            key={c.id}
            style={{
              padding: "12px 16px",
              background: "#fbf9f5",
              border: "1px solid #e9e3d8",
              borderRadius: "12px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#173b31" }}>
              {c.destinatario} · <span className="pill-state neutral">{c.tipo}</span>
            </p>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#4f5b55" }}>{c.contenido}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
