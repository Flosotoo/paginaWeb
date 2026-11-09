import { useState } from "react";
import { useCorrecciones } from "../../hooks/useCorrecciones";
export function CorreccionDatos() {
  const { usuario, aviso, procesando, solicitudes, crear, resolver } =
    useCorrecciones();
  const [campo, setCampo] = useState("correo");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  return (
    <section className="account-section">
      <div className="section-heading" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">DATOS PERSONALES</span>
          <h2 id="correcciones">Corrección de datos</h2>
        </div>
      </div>

      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "16px" }}>{aviso}</p>}
      {solicitudes.error && <p role="alert">{solicitudes.error}</p>}

      <div className="card">
        <span className="eyebrow">SOLICITUD DE RECTIFICACIÓN</span>
        <h3>Solicitar modificación</h3>
        <p className="card-desc">Si tus datos registran un error tipográfico o desactualización, solicita su corrección para revisión del administrador.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void crear(campo, valor.trim(), motivo.trim());
          }}
        >
          <div className="form-grid-2">
            <label>
              Dato a corregir
              <select
                className="input"
                value={campo}
                onChange={(e) => setCampo(e.target.value)}
              >
                <option value="correo">Correo</option>
                <option value="primerNombre">Nombre</option>
                <option value="primerApellido">Apellido</option>
                {usuario?.rol === "APODERADO" && (
                  <option value="telefono">Teléfono</option>
                )}
                {usuario?.rol === "ALUMNO" && <option value="curso">Curso</option>}
              </select>
            </label>
            <label>
              Valor propuesto
              <input
                className="input"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Motivo de corrección
            <input
              className="input"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </label>
          <div className="form-actions">
            <button className="btn" disabled={procesando}>
              Solicitar corrección
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <span className="eyebrow">HISTORIAL DE SOLICITUDES</span>
        <h3>Mis solicitudes registradas</h3>
        {solicitudes.datos?.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No hay solicitudes de corrección pendientes.</p>
        )}
        <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
          {solicitudes.datos?.map((s) => (
            <article
              key={s.id}
              style={{
                padding: "14px 18px",
                borderRadius: "14px",
                background: "#fbf9f5",
                border: "1px solid #e9e3d8",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "#173b31" }}>
                  {s.campoSolicitado}: <span style={{ color: "var(--forest)" }}>{s.valorPropuesto}</span>
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px", alignItems: "center" }}>
                  <span className={`pill-state ${s.estado === "APROBADA" ? "" : s.estado === "RECHAZADA" ? "bad" : "warn"}`}>
                    {s.estado}
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Usuario #{s.usuarioId}</span>
                </div>
              </div>
              {usuario?.rol === "ADMINISTRADOR" && s.estado === "PENDIENTE" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn"
                    disabled={procesando}
                    onClick={() => resolver(s.id, true)}
                  >
                    Aprobar corrección
                  </button>
                  <button
                    className="btn secondary"
                    disabled={procesando}
                    onClick={() => resolver(s.id, false)}
                  >
                    Rechazar corrección
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
