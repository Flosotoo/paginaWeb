import { useState } from "react";
import type { Usuario } from "../../services/usuarios";
import { useVinculos } from "../../hooks/useVinculos";
export function GestionVinculos({
  usuarios,
  recargarUsuarios,
}: {
  usuarios: Usuario[];
  recargarUsuarios?: () => Promise<unknown>;
}) {
  const {
    alumno,
    setAlumno,
    aviso,
    procesando,
    vinculos,
    vincular,
    desvincular,
    actualizarCurso,
  } = useVinculos(recargarUsuarios);
  const [curso, setCurso] = useState("");
  const [nombreAlumno, setNombreAlumno] = useState("");
  const [apellidoAlumno, setApellidoAlumno] = useState("");
  const [rutAlumno, setRutAlumno] = useState("");
  const [fechaNacimientoAlumno, setFechaNacimientoAlumno] = useState("");
  const [apoderado, setApoderado] = useState("");
  const [parentesco, setParentesco] = useState("PADRE");
  const [motivo, setMotivo] = useState("");
  return (
    <div className="card" id="vinculos">
      <span className="eyebrow">FAMILIAS Y TUTORES</span>
      <h3>Vínculos familiares</h3>
      <p className="card-desc">
        Consulta y administra la asociación entre apoderados y estudiantes, o actualiza los datos del alumno.
      </p>

      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "14px" }}>{aviso}</p>}
      {vinculos.error && <p role="alert">{vinculos.error}</p>}

      <label style={{ maxWidth: "460px" }}>
        Alumno vinculado
        <select
          className="input"
          value={alumno}
          onChange={(e) => setAlumno(Number(e.target.value))}
        >
          <option value="0">Selecciona</option>
          {usuarios
            .filter((u) => u.rol.endsWith("ALUMNO"))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombreCompleto} · {u.rut}
              </option>
            ))}
        </select>
      </label>

      {alumno > 0 && (
        <div style={{ marginTop: "20px", display: "grid", gap: "20px" }}>
          <div style={{ padding: "18px", background: "#fbf9f5", border: "1px solid #e9e3d8", borderRadius: "14px" }}>
            <span className="eyebrow">ACTUALIZACIÓN DE FICHA</span>
            <h4 style={{ margin: "4px 0 12px" }}>Actualizar curso y datos del alumno</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void actualizarCurso(curso.trim(), {
                  ...(nombreAlumno.trim()
                    ? { primerNombre: nombreAlumno.trim() }
                    : {}),
                  ...(apellidoAlumno.trim()
                    ? { primerApellido: apellidoAlumno.trim() }
                    : {}),
                  ...(rutAlumno.trim() ? { rut: rutAlumno.trim() } : {}),
                  ...(fechaNacimientoAlumno.trim()
                    ? { fechaNacimiento: fechaNacimientoAlumno.trim() }
                    : {}),
                });
              }}
            >
              <div className="form-grid-2">
                <label>
                  Nuevo curso
                  <input
                    className="input"
                    value={curso}
                    onChange={(e) => setCurso(e.target.value)}
                    required
                  />
                </label>
                <label>
                  RUT corregido del alumno
                  <input
                    className="input"
                    value={rutAlumno}
                    onChange={(e) => setRutAlumno(e.target.value)}
                  />
                </label>
              </div>
              <div className="form-grid-3">
                <label>
                  Nombre corregido del alumno
                  <input
                    className="input"
                    value={nombreAlumno}
                    onChange={(e) => setNombreAlumno(e.target.value)}
                  />
                </label>
                <label>
                  Apellido corregido del alumno
                  <input
                    className="input"
                    value={apellidoAlumno}
                    onChange={(e) => setApellidoAlumno(e.target.value)}
                  />
                </label>
                <label>
                  Fecha de nacimiento corregida
                  <input
                    className="input"
                    type="date"
                    value={fechaNacimientoAlumno}
                    onChange={(e) => setFechaNacimientoAlumno(e.target.value)}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button className="btn" disabled={procesando}>
                  Actualizar curso
                </button>
              </div>
            </form>
          </div>

          <div style={{ padding: "18px", background: "#fbf9f5", border: "1px solid #e9e3d8", borderRadius: "14px" }}>
            <span className="eyebrow">ASOCIACIÓN FAMILIAR</span>
            <h4 style={{ margin: "4px 0 12px" }}>Vincular nuevo apoderado</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void vincular(Number(apoderado), parentesco);
              }}
            >
              <div className="form-grid-2">
                <label>
                  Apoderado a vincular
                  <select
                    className="input"
                    value={apoderado}
                    onChange={(e) => setApoderado(e.target.value)}
                    required
                  >
                    <option value="">Selecciona</option>
                    {usuarios
                      .filter(
                        (u) =>
                          u.rol.endsWith("APODERADO") && u.estado !== "INACTIVA",
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombreCompleto} · {u.rut}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Relación
                  <select
                    className="input"
                    value={parentesco}
                    onChange={(e) => setParentesco(e.target.value)}
                  >
                    <option value="PADRE">Padre</option>
                    <option value="MADRE">Madre</option>
                    <option value="TUTOR_LEGAL">Tutor legal</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button className="btn" disabled={procesando}>
                  Vincular
                </button>
              </div>
            </form>
          </div>

          <div>
            <span className="eyebrow">APODERADOS ACTUALES</span>
            <h4 style={{ margin: "4px 0 10px" }}>Vínculos registrados</h4>
            <label style={{ maxWidth: "460px", marginBottom: "12px" }}>
              Motivo de desvinculación
              <input
                className="input"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Obligatorio para desvincular"
              />
            </label>
            <div style={{ display: "grid", gap: "10px" }}>
              {vinculos.datos?.map((v) => (
                <article
                  key={v.id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "#fff",
                    border: "1px solid #e5dfd5",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <strong>{v.nombreCompleto}</strong> · {v.parentesco} ·{" "}
                    <span className={`pill-state ${v.activo ? "" : "bad"}`}>
                      {v.activo ? "Activo" : "Desvinculado"}
                    </span>
                    {!v.activo && (
                      <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                        Motivo: {v.motivoDesvinculacion}
                      </p>
                    )}
                  </div>
                  {v.activo && (
                    <button
                      className="btn secondary"
                      disabled={procesando || !motivo.trim()}
                      onClick={() => void desvincular(v.id, motivo.trim())}
                    >
                      Desvincular
                    </button>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
