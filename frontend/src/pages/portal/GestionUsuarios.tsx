import { LiquidacionSaldo } from "./LiquidacionSaldo";
import { ImportarNomina } from "./ImportarNomina";
import { GestionVinculos } from "./GestionVinculos";
import { AltaAlumnoForm } from "./AltaAlumno";
import { useState, type FormEvent } from "react";
import { useGestionUsuarios } from "../../hooks/useGestionUsuarios";
import type { NuevoUsuario } from "../../services/usuarios";
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
  const [rut, setRut] = useState("");
  const [primerNombre, setNombre] = useState("");
  const [primerApellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<NuevoUsuario["rol"]>("APODERADO");

  // Sub-navegación modular
  const [subseccion, setSubseccion] = useState<string>("todas");

  // Filtros y paginación para Nómina de Usuarios
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [paginaUsuario, setPaginaUsuario] = useState(1);

  // Ordenar usuarios más recientes primero
  const usuariosOrdenados = [...(usuarios.datos ?? [])].sort((a, b) => b.id - a.id);

  const usuariosFiltrados = usuariosOrdenados.filter((u) => {
    if (filtroRol !== "TODOS" && u.rol.replace("ROLE_", "") !== filtroRol) return false;
    if (filtroEstado !== "TODOS" && u.estado !== filtroEstado) return false;
    if (busquedaUsuario.trim()) {
      const q = busquedaUsuario.trim().toLowerCase();
      const coincide =
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.rut.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q);
      if (!coincide) return false;
    }
    return true;
  });

  const TAMANO_PAGINA_USUARIOS = 12;
  const totalPaginasUsuarios = Math.max(1, Math.ceil(usuariosFiltrados.length / TAMANO_PAGINA_USUARIOS));
  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaUsuario - 1) * TAMANO_PAGINA_USUARIOS,
    paginaUsuario * TAMANO_PAGINA_USUARIOS,
  );
  function enviar(e: FormEvent) {
    e.preventDefault();
    void crear({ rut, primerNombre, primerApellido, correo, rol });
  }
  return (
    <section className="account-section">
      <div className="section-heading" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">ADMINISTRACIÓN DE CUENTAS</span>
          <h2 id="personas">Personas</h2>
        </div>
      </div>

      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "16px" }}>{aviso}</p>}
      {usuarios.error && <p role="alert">{usuarios.error}</p>}

      {/* Barra de sub-navegación modular */}
      <div className="subnav-cards" style={{ marginBottom: "22px" }}>
        {[
          ["todas", "Vista completa", "Todos los bloques en una sola pantalla"],
          ["registro", "1. Registro y Matrícula", "Alta individual, matrícula alumno+apoderado y CSV"],
          ["vinculos", "2. Vínculos y Liquidación", "Asociaciones familiares y cierre de saldo"],
          ["nomina", "3. Nómina de Usuarios", "Directorio escolar con búsqueda y filtros"],
        ].map(([id, titulo, desc]) => (
          <button
            key={id}
            type="button"
            className={`subnav-card ${subseccion === id ? "active" : ""}`}
            onClick={() => setSubseccion(id)}
          >
            <strong>{titulo}</strong>
            <span>{desc}</span>
          </button>
        ))}
      </div>

      {(subseccion === "todas" || subseccion === "registro") && (
        <>
          <div className="card">
            <span className="eyebrow">REGISTRO INDIVIDUAL</span>
            <h3>Registrar persona</h3>
            <p className="card-desc">Crea una cuenta individual para apoderados o personal encargado del establecimiento.</p>
            <form onSubmit={enviar}>
              <div className="form-grid-3">
                <label>
                  RUT
                  <input
                    className="input"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Nombre
                  <input
                    className="input"
                    value={primerNombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Apellido
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
                  Correo
                  <input
                    className="input"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Rol
                  <select
                    className="input"
                    value={rol}
                    onChange={(e) => setRol(e.target.value as NuevoUsuario["rol"])}
                  >
                    <option value="APODERADO">Apoderado</option>
                    <option value="ENCARGADO">Encargado</option>
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button className="btn" disabled={procesando}>
                  Registrar
                </button>
              </div>
            </form>
          </div>

          <AltaAlumnoForm
            crear={crearAlumno}
            procesando={procesando}
            apoderados={usuarios.datos ?? []}
          />

          <ImportarNomina importar={importar} procesando={procesando} />
        </>
      )}

      {(subseccion === "todas" || subseccion === "vinculos") && (
        <>
          <GestionVinculos
            usuarios={usuarios.datos ?? []}
            recargarUsuarios={usuarios.recargar}
          />

          <LiquidacionSaldo usuarios={usuarios.datos ?? []} />
        </>
      )}

      {(subseccion === "todas" || subseccion === "nomina") && (
        <div className="card">
          <span className="eyebrow">NÓMINA INSTITUCIONAL</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
            <h3 style={{ margin: 0 }}>Usuarios del establecimiento</h3>
            <span className="pill-state neutral">{usuariosFiltrados.length} usuarios</span>
          </div>
          <p className="card-desc">Cuentas activas e inactivas registradas en el establecimiento.</p>

          {/* Filtros de la nómina */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", margin: "14px 0", background: "#fbf9f5", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e9e3d8" }}>
            <div>
              <label htmlFor="busqueda-usuario" style={{ fontSize: "0.82rem", margin: "0 0 4px" }}>
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
              <label htmlFor="filtro-rol-usuario" style={{ fontSize: "0.82rem", margin: "0 0 4px" }}>
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
              <label htmlFor="filtro-estado-usuario" style={{ fontSize: "0.82rem", margin: "0 0 4px" }}>
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
            <p className="muted" style={{ margin: "16px 0" }}>No se encontraron usuarios con los criterios indicados.</p>
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
                  <p style={{ margin: 0, fontWeight: 700, color: "#173b31", fontSize: "0.95rem" }}>
                    {u.nombreCompleto} · <span style={{ fontWeight: 400, color: "var(--muted)" }}>{u.rut}</span>
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px", alignItems: "center" }}>
                    <span className="pill-state neutral">{u.rol}</span>
                    <span className={`pill-state ${u.estado === "ACTIVA" ? "" : "bad"}`}>
                      {u.estado}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{u.correo}</span>
                  </div>
                  {u.rol.replace("ROLE_", "") === "ALUMNO" && u.estado !== "INACTIVA" && (
                    <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                      La baja está suspendida hasta contar con un cierre de saldo seguro.
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="btn secondary"
                    disabled={procesando || (u.rol.replace("ROLE_", "") === "ALUMNO" && u.estado !== "INACTIVA")}
                    onClick={() =>
                      u.estado === "INACTIVA" ? reactivar(u.id) : inactivar(u.id)
                    }
                  >
                    {u.estado === "INACTIVA" ? "Reactivar" : "Inactivar"}
                  </button>
                  <button
                    className="btn"
                    disabled={procesando}
                    onClick={() => restablecer(u.id)}
                  >
                    Restablecer contraseña
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Barra de Paginación */}
          {totalPaginasUsuarios > 1 && (
            <div className="pagination-bar">
              <span>
                Página {paginaUsuario} de {totalPaginasUsuarios} ({usuariosFiltrados.length} cuentas)
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
                  onClick={() => setPaginaUsuario((p) => Math.min(totalPaginasUsuarios, p + 1))}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
