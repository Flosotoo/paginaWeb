import { LiquidacionSaldo } from "./LiquidacionSaldo";
import { ImportarNomina } from "./ImportarNomina";
import { GestionVinculos } from "./GestionVinculos";
import { AltaAlumnoForm } from "./AltaAlumno";
import { useState, type FormEvent } from "react";
import { useGestionUsuarios } from "../../hooks/useGestionUsuarios";
import type { NuevoUsuario } from "../../services/usuarios";
import {
  coincideRut,
  formatearRutVisual,
  mensajeErrorRut,
  normalizarRutCanonicamente,
} from "../../utils/rut";

type PestanaPersonas = "nomina" | "matricular" | "personal" | "vinculos";

export function GestionUsuarios() {
  const {
    usuarios,
    aviso,
    procesando,
    crear,
    crearAlumno,
    importar,
    inactivar,
    reactivar,
    restablecer,
  } = useGestionUsuarios();

  // Pestaña activa: comienza en la nómina limpia para evitar un muro vertical de formularios.
  const [subseccion, setSubseccion] = useState<PestanaPersonas>("nomina");

  // Estado del formulario de alta individual (Apoderado / Encargado)
  const [rut, setRut] = useState("");
  const [errorRut, setErrorRut] = useState("");
  const [primerNombre, setNombre] = useState("");
  const [primerApellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<NuevoUsuario["rol"]>("APODERADO");
  const [feedbackPersonal, setFeedbackPersonal] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  // Filtros y paginación para Nómina de Usuarios
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [paginaUsuario, setPaginaUsuario] = useState(1);

  const listaUsuarios = usuarios.datos ?? [];
  const totalAlumnos = listaUsuarios.filter(
    (u) => u.rol.replace("ROLE_", "") === "ALUMNO",
  ).length;
  const totalApoderados = listaUsuarios.filter(
    (u) => u.rol.replace("ROLE_", "") === "APODERADO",
  ).length;
  const totalEncargados = listaUsuarios.filter(
    (u) => u.rol.replace("ROLE_", "") === "ENCARGADO",
  ).length;

  const usuariosOrdenados = [...listaUsuarios].sort((a, b) => b.id - a.id);

  const usuariosFiltrados = usuariosOrdenados.filter((u) => {
    if (filtroRol !== "TODOS" && u.rol.replace("ROLE_", "") !== filtroRol)
      return false;
    if (filtroEstado !== "TODOS" && u.estado !== filtroEstado) return false;
    if (busquedaUsuario.trim()) {
      const q = busquedaUsuario.trim().toLowerCase();
      const coincide =
        u.nombreCompleto.toLowerCase().includes(q) ||
        coincideRut(u.rut, busquedaUsuario) ||
        u.correo.toLowerCase().includes(q);
      if (!coincide) return false;
    }
    return true;
  });

  const TAMANO_PAGINA_USUARIOS = 12;
  const totalPaginasUsuarios = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / TAMANO_PAGINA_USUARIOS),
  );
  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaUsuario - 1) * TAMANO_PAGINA_USUARIOS,
    paginaUsuario * TAMANO_PAGINA_USUARIOS,
  );

  async function enviarPersonal(e: FormEvent) {
    e.preventDefault();
    setFeedbackPersonal(null);
    const err = mensajeErrorRut(rut);
    if (err) {
      setErrorRut(err);
      setFeedbackPersonal({
        tipo: "error",
        texto: "Revisa el RUT ingresado. Tus demás datos se mantienen intactos.",
      });
      return;
    }
    const rutCanonico = normalizarRutCanonicamente(rut);
    if (!rutCanonico) {
      setErrorRut("RUT inválido.");
      return;
    }
    setErrorRut("");
    const res = await crear({
      rut: rutCanonico,
      primerNombre: primerNombre.trim(),
      primerApellido: primerApellido.trim(),
      correo: correo.trim(),
      rol,
    });
    if (!res.ok) {
      setFeedbackPersonal({ tipo: "error", texto: res.mensaje });
      return;
    }
    setFeedbackPersonal({ tipo: "ok", texto: res.mensaje });
    setRut("");
    setNombre("");
    setApellido("");
    setCorreo("");
  }

  return (
    <section className="account-section">
      <div className="people-header">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN DE CUENTAS</span>
          <h2 id="personas" style={{ margin: "2px 0 0" }}>
            Personas
          </h2>
          <div className="people-stats">
            <span className="pill-state neutral">{listaUsuarios.length} cuentas</span>
            <span className="pill-state">{totalAlumnos} alumnos</span>
            <span className="pill-state neutral">{totalApoderados} apoderados</span>
            <span className="pill-state neutral">{totalEncargados} encargados</span>
          </div>
        </div>

        <div className="people-header-actions">
          <button
            type="button"
            className="btn"
            onClick={() => setSubseccion("matricular")}
          >
            + Matricular alumno
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setSubseccion("personal")}
          >
            + Registrar apoderado / encargado
          </button>
        </div>
      </div>

      {usuarios.error && <p role="alert">{usuarios.error}</p>}

      {/* Pestañas limpias por tarea */}
      <div className="subnav-cards" role="tablist" aria-label="Gestión de personas">
        {(
          [
            [
              "nomina",
              `1. Nómina (${listaUsuarios.length})`,
              "Directorio escolar con búsqueda, filtros y acciones",
            ],
            [
              "matricular",
              "2. Matricular alumno",
              "Alta guiada con apoderado y carga masiva CSV",
            ],
            [
              "personal",
              "3. Apoderados y encargados",
              "Registro individual de cuentas de adultos",
            ],
            [
              "vinculos",
              "4. Vínculos y liquidación",
              "Asociaciones familiares, curso y cierre de saldo",
            ],
          ] as [PestanaPersonas, string, string][]
        ).map(([id, titulo, desc]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={subseccion === id}
            className={`subnav-card ${subseccion === id ? "active" : ""}`}
            onClick={() => setSubseccion(id)}
          >
            <strong>{titulo}</strong>
            <span>{desc}</span>
          </button>
        ))}
      </div>

      {subseccion === "nomina" && (
        <div className="card">
          <span className="eyebrow">NÓMINA INSTITUCIONAL</span>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <h3 style={{ margin: 0 }}>Usuarios del establecimiento</h3>
            <span className="pill-state neutral">
              {usuariosFiltrados.length} visibles
            </span>
          </div>
          <p className="card-desc">
            Cuentas activas e inactivas registradas en el establecimiento.
          </p>

          {aviso && (
            <p role="status" className="form-feedback" style={{ marginBottom: "14px" }}>
              {aviso}
            </p>
          )}

          {/* Filtros de la nómina */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              margin: "14px 0",
              background: "#fbf9f5",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #e9e3d8",
            }}
          >
            <div>
              <label
                htmlFor="busqueda-usuario"
                style={{ fontSize: "0.82rem", margin: "0 0 4px" }}
              >
                Buscar por nombre, RUT o correo
              </label>
              <input
                id="busqueda-usuario"
                className="input"
                placeholder="Ej: Pérez, 12.345..."
                value={busquedaUsuario}
                onChange={(e) => {
                  setBusquedaUsuario(e.target.value);
                  setPaginaUsuario(1);
                }}
              />
            </div>
            <div>
              <label
                htmlFor="filtro-rol-usuario"
                style={{ fontSize: "0.82rem", margin: "0 0 4px" }}
              >
                Filtrar por rol
              </label>
              <select
                id="filtro-rol-usuario"
                className="input"
                value={filtroRol}
                onChange={(e) => {
                  setFiltroRol(e.target.value);
                  setPaginaUsuario(1);
                }}
              >
                <option value="TODOS">Todos los roles</option>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="ENCARGADO">Encargado</option>
                <option value="APODERADO">Apoderado</option>
                <option value="ALUMNO">Alumno</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="filtro-estado-usuario"
                style={{ fontSize: "0.82rem", margin: "0 0 4px" }}
              >
                Filtrar por estado
              </label>
              <select
                id="filtro-estado-usuario"
                className="input"
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPaginaUsuario(1);
                }}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVA">Activa</option>
                <option value="PRIMER_ACCESO">Primer acceso</option>
                <option value="INACTIVA">Inactiva</option>
              </select>
            </div>
          </div>

          {usuarios.cargando && <p>Cargando…</p>}
          {usuariosFiltrados.length === 0 && !usuarios.cargando && (
            <p className="muted" style={{ margin: "16px 0" }}>
              No se encontraron usuarios con los criterios indicados.
            </p>
          )}

          <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
            {usuariosPaginados.map((u) => (
              <article
                key={u.id}
                style={{
                  padding: "14px 18px",
                  background: "#fbf9f5",
                  border: "1px solid #e9e3d8",
                  borderRadius: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      color: "#173b31",
                      fontSize: "0.95rem",
                    }}
                  >
                    {u.nombreCompleto} ·{" "}
                    <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                      {formatearRutVisual(u.rut)}
                    </span>
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "6px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="pill-state neutral">
                      {u.rol.replace("ROLE_", "")}
                    </span>
                    <span
                      className={`pill-state ${u.estado === "ACTIVA" ? "" : "bad"}`}
                    >
                      {u.estado}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {u.correo}
                    </span>
                  </div>
                  {u.rol.replace("ROLE_", "") === "ALUMNO" &&
                    u.estado !== "INACTIVA" && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: "0.82rem",
                          color: "var(--muted)",
                        }}
                      >
                        La baja está suspendida hasta contar con un cierre de
                        saldo seguro.
                      </p>
                    )}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="btn secondary"
                    disabled={
                      procesando ||
                      (u.rol.replace("ROLE_", "") === "ALUMNO" &&
                        u.estado !== "INACTIVA")
                    }
                    onClick={() =>
                      void (u.estado === "INACTIVA"
                        ? reactivar(u.id)
                        : inactivar(u.id))
                    }
                  >
                    {u.estado === "INACTIVA" ? "Reactivar" : "Inactivar"}
                  </button>
                  <button
                    className="btn"
                    disabled={procesando}
                    onClick={() => void restablecer(u.id)}
                  >
                    Restablecer contraseña
                  </button>
                </div>
              </article>
            ))}
          </div>

          {totalPaginasUsuarios > 1 && (
            <div className="pagination-bar">
              <span>
                Página {paginaUsuario} de {totalPaginasUsuarios} (
                {usuariosFiltrados.length} cuentas)
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  disabled={paginaUsuario <= 1}
                  onClick={() => setPaginaUsuario((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaUsuario >= totalPaginasUsuarios}
                  onClick={() =>
                    setPaginaUsuario((p) =>
                      Math.min(totalPaginasUsuarios, p + 1),
                    )
                  }
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {subseccion === "matricular" && (
        <>
          <AltaAlumnoForm
            crear={crearAlumno}
            procesando={procesando}
            apoderados={listaUsuarios}
            onVerNomina={() => {
              setFiltroRol("ALUMNO");
              setPaginaUsuario(1);
              setSubseccion("nomina");
            }}
          />

          <details className="csv-details">
            <summary>
              <span>Carga masiva de alumnos mediante archivo CSV</span>
              <span className="pill-state neutral">Opcional</span>
            </summary>
            <ImportarNomina importar={importar} procesando={procesando} />
          </details>
        </>
      )}

      {subseccion === "personal" && (
        <div className="card">
          <span className="eyebrow">REGISTRO INDIVIDUAL</span>
          <h3>Registrar apoderado o encargado</h3>
          <p className="card-desc">
            Crea una cuenta para apoderados o personal de librería.{" "}
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#18543c",
                fontWeight: 700,
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => setSubseccion("matricular")}
            >
              ¿Necesitas matricular un alumno? Hazlo aquí →
            </button>
          </p>
          <form onSubmit={(e) => void enviarPersonal(e)}>
            <div className="form-grid-3">
              <label>
                RUT *
                <input
                  className={`input ${errorRut ? "input-error" : ""}`}
                  placeholder="Ej: 12.345.678-5"
                  maxLength={15}
                  value={rut}
                  onChange={(e) => {
                    setRut(e.target.value);
                    if (errorRut) setErrorRut("");
                  }}
                  onBlur={() => setRut((prev) => formatearRutVisual(prev))}
                  required
                />
                {errorRut && <span className="field-error">{errorRut}</span>}
              </label>
              <label>
                Nombre *
                <input
                  className="input"
                  value={primerNombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </label>
              <label>
                Apellido *
                <input
                  className="input"
                  value={primerApellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="form-grid-2">
              <label>
                Correo *
                <input
                  className="input"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </label>
              <label>
                Rol *
                <select
                  className="input"
                  value={rol}
                  onChange={(e) =>
                    setRol(e.target.value as NuevoUsuario["rol"])
                  }
                >
                  <option value="APODERADO">Apoderado</option>
                  <option value="ENCARGADO">Encargado</option>
                </select>
              </label>
            </div>

            {feedbackPersonal && (
              <div
                className={`form-feedback ${feedbackPersonal.tipo === "error" ? "error" : ""}`}
                role={feedbackPersonal.tipo === "error" ? "alert" : "status"}
              >
                {feedbackPersonal.texto}
              </div>
            )}

            <div className="form-actions">
              <button className="btn" disabled={procesando}>
                {procesando ? "Registrando…" : "Registrar cuenta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {subseccion === "vinculos" && (
        <>
          <GestionVinculos
            usuarios={listaUsuarios}
            recargarUsuarios={usuarios.recargar}
          />
          <LiquidacionSaldo usuarios={listaUsuarios} />
        </>
      )}
    </section>
  );
}
