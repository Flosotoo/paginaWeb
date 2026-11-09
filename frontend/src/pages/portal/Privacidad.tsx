import { usePrivacidad, VERSION_AVISO } from "../../hooks/usePrivacidad";
export function AvisoTexto() {
  return (
    <p>
      Versión {VERSION_AVISO}. EduSaldo registra datos de identificación y
      vínculos escolares, junto con movimientos de saldo, reservas y entregas,
      para prestar y administrar el servicio de materiales del establecimiento.
      El acceso se restringe según el rol y establecimiento de cada usuario.
      Puedes solicitar la corrección de tus datos desde esta pantalla.
    </p>
  );
}
export function Privacidad() {
  const {
    usuario,
    usuarioConsultado,
    setUsuarioConsultado,
    procesando,
    aviso,
    historial,
    aceptar,
  } = usePrivacidad();
  return (
    <div className="card">
      <span className="eyebrow">PROTECCIÓN DE DATOS</span>
      <h3 id="privacidad">Aviso de privacidad</h3>
      <AvisoTexto />
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "10px 0 16px" }}>
        Consultar este aviso no registra una aceptación. Si estás de acuerdo,
        selecciona expresamente el botón siguiente.
      </p>
      <div className="form-actions" style={{ marginBottom: "16px" }}>
        <button className="btn" disabled={procesando} onClick={aceptar}>
          Aceptar aviso de privacidad
        </button>
      </div>
      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "12px" }}>{aviso}</p>}
      {historial.error && <p role="alert">{historial.error}</p>}
      {usuario?.rol === "ADMINISTRADOR" && (
        <label style={{ maxWidth: "340px", marginTop: "14px" }}>
          Usuario a consultar consentimientos
          <input
            className="input"
            type="number"
            min="1"
            value={usuarioConsultado ?? usuario.usuarioId}
            onChange={(e) =>
              setUsuarioConsultado(
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </label>
      )}
      <div style={{ marginTop: "20px", borderTop: "1px solid #eee8df", paddingTop: "14px" }}>
        <h4 style={{ margin: "0 0 10px" }}>Mis aceptaciones</h4>
        {historial.datos?.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>No hay aceptaciones registradas.</p>}
        <div style={{ display: "grid", gap: "6px" }}>
          {historial.datos?.map((c) => (
            <div key={c.id} className="pill-state neutral" style={{ justifySelf: "start" }}>
              Versión {c.versionAviso} · {new Date(c.fechaAceptacion).toLocaleString("es-CL")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
