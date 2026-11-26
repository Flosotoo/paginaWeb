import { useEffect, useState } from "react";
import type { Usuario } from "../../services/usuarios";
import { useVinculos } from "../../hooks/useVinculos";
import {
  formatearRutVisual,
  mensajeErrorRut,
  normalizarRutCanonicamente,
} from "../../utils/rut";
export function GestionVinculos({
  usuarios,
  recargarUsuarios,
  alumnoId,
}: {
  usuarios: Usuario[];
  alumnoId?: number;
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
  useEffect(() => { if (alumnoId !== undefined) setAlumno(alumnoId); }, [alumnoId, setAlumno]);
  const [busquedaApoderado, setBusquedaApoderado] = useState("");
  const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const [curso, setCurso] = useState("");
  const [nombreAlumno, setNombreAlumno] = useState("");
  const [apellidoAlumno, setApellidoAlumno] = useState("");
  const [rutAlumno, setRutAlumno] = useState("");
  const [errorRut, setErrorRut] = useState("");
  const [fechaNacimientoAlumno, setFechaNacimientoAlumno] = useState("");
  const [apoderado, setApoderado] = useState("");
  const [parentesco, setParentesco] = useState("PADRE");
  const [motivo, setMotivo] = useState("");
  return (
    <div className="card" id="vinculos">
      <h3>Datos y vínculos del alumno</h3>

      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "14px" }}>{aviso}</p>}
      {vinculos.error && <p role="alert">{vinculos.error}</p>}

      {alumnoId === undefined && <label style={{ maxWidth: "460px" }}>
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
      </label>}

      {alumno > 0 && (alumnoId === undefined || alumno === alumnoId) && (
        <div style={{ marginTop: "20px", display: "grid", gap: "20px" }}>
          <details style={{ padding: "12px", background: "#fbf9f5", border: "1px solid #e9e3d8", borderRadius: "12px" }}>
            <summary>Actualizar curso y datos del alumno</summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                let rutCorregido: string | undefined;
                if (rutAlumno.trim()) {
                  const err = mensajeErrorRut(rutAlumno);
                  if (err) {
                    setErrorRut(err);
                    return;
                  }
                  const canonico = normalizarRutCanonicamente(rutAlumno);
                  if (!canonico) {
                    setErrorRut("RUT inválido.");
                    return;
                  }
                  rutCorregido = canonico;
                }
                setErrorRut("");
                void actualizarCurso(curso.trim(), {
                  ...(nombreAlumno.trim()
                    ? { primerNombre: nombreAlumno.trim() }
                    : {}),
                  ...(apellidoAlumno.trim()
                    ? { primerApellido: apellidoAlumno.trim() }
                    : {}),
                  ...(rutCorregido ? { rut: rutCorregido } : {}),
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
                    placeholder="Ej: 23.456.789-6"
                    maxLength={15}
                    value={rutAlumno}
                    onChange={(e) => {
                      setRutAlumno(e.target.value);
                      if (errorRut) setErrorRut("");
                    }}
                    onBlur={() => setRutAlumno((prev) => formatearRutVisual(prev))}
                  />
                </label>
              </div>
              {errorRut && (
                <p role="alert" style={{ margin: "6px 0 10px", color: "#b91c1c", fontWeight: 600 }}>
                  {errorRut}
                </p>
              )}
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
          </details>

          <details style={{ padding: "12px", background: "#fbf9f5", border: "1px solid #e9e3d8", borderRadius: "12px" }}>
            <summary>Vincular otro apoderado</summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void vincular(Number(apoderado), parentesco);
              }}
            >
              <label>Buscar apoderado por nombre o RUT<input className="input" value={busquedaApoderado} onChange={e => setBusquedaApoderado(e.target.value)} /></label>
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
                          u.rol.endsWith("APODERADO") && u.estado !== "INACTIVA" && (String(u.id) === apoderado || normalizar(u.nombreCompleto).includes(normalizar(busquedaApoderado.trim())) || (busquedaApoderado.trim().replace(/[.\-]/g, "").length > 0 && u.rut.replace(/[.\-]/g, "").includes(busquedaApoderado.trim().replace(/[.\-]/g, ""))) ),
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
          </details>

          <details style={{ padding: 12, border: "1px solid #e9e3d8", borderRadius: 12 }}>
            <summary>Consultar apoderados e historial</summary>
            {vinculos.cargando && <p role="status">Consultando vínculos…</p>}
            {vinculos.datos?.length === 0 && <p>No hay vínculos registrados.</p>}
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
          </details>
        </div>
      )}
    </div>
  );
}
