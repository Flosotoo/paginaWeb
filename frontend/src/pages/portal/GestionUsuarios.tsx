import { ModalCredenciales } from "../../components/ModalCredenciales";
import "../../components/nominaUsuarios.css";
import { ModalConfirmacion, type SolicitudConfirmacion } from "../../components/ModalConfirmacion";
import { LiquidacionSaldo } from "./LiquidacionSaldo";
import { ImportarNomina } from "./ImportarNomina";
import { GestionVinculos } from "./GestionVinculos";
import { AltaAlumnoForm } from "./AltaAlumno";
import { useState, type FormEvent } from "react";
import { useSesion } from "../../context/SesionContext";
import { useGestionUsuarios } from "../../hooks/useGestionUsuarios";
import type { NuevoUsuario } from "../../services/usuarios";
import {
  coincideRut,
  formatearRutVisual,
  mensajeErrorRut,
  normalizarRutCanonicamente,
} from "../../utils/rut";

type PestanaPersonas = "nomina" | "registro" | "liquidacion" | "menu";

export function GestionUsuarios() {
  const { usuario } = useSesion();
  const [confirmacion, setConfirmacion] = useState<SolicitudConfirmacion | null>(null);
  const {
    usuarios,
    credenciales,
    cerrarCredenciales,
    aviso,
    procesando,
    crear,
    crearAlumno,
    importar,
    inactivar,
    reactivar,
    restablecer,
  } = useGestionUsuarios();

  // Mostrar las opciones antes de abrir la nómina o los formularios.
  const [subseccion, setSubseccion] = useState<PestanaPersonas>("menu");

  // Estado del formulario de alta individual (Apoderado / Encargado)
  const [rut, setRut] = useState("");
  const [errorRut, setErrorRut] = useState("");
  const [primerNombre, setNombre] = useState("");
  const [primerApellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<NuevoUsuario["rol"]>("APODERADO");
  const [perfilRegistro, setPerfilRegistro] = useState<"ALUMNO" | NuevoUsuario["rol"] | "">("");
  const [feedbackPersonal, setFeedbackPersonal] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  // Filtros y paginación para Nómina de Usuarios
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [paginaUsuario, setPaginaUsuario] = useState(1);
  const [usuarioAbierto, setUsuarioAbierto] = useState<number | null>(null);

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

  const totalAdministradores = listaUsuarios.filter(u => u.rol.replace("ROLE_", "") === "ADMINISTRADOR").length;
  const normalizar = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CL").trim();
  const usuariosOrdenados = [...listaUsuarios].sort((a, b) => b.id - a.id);

  const usuariosFiltrados = usuariosOrdenados.filter((u) => {
    if (filtroRol !== "TODOS" && u.rol.replace("ROLE_", "") !== filtroRol)
      return false;
    if (filtroEstado !== "TODOS" && u.estado !== filtroEstado) return false;
    if (busquedaUsuario.trim()) {
      const q = normalizar(busquedaUsuario);
      const coincide =
        normalizar(u.nombreCompleto).includes(q) ||
        coincideRut(u.rut, busquedaUsuario) ||
        normalizar(u.correo).includes(q);
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
      {confirmacion && <ModalConfirmacion solicitud={confirmacion} cerrar={() => setConfirmacion(null)} />}
      <header style={{ background: "#20433a", color: "#fff", padding: "16px 20px", borderRadius: 12, marginBottom: 16 }}>
        <h2 id="personas" style={{ margin: 0, color: "inherit" }}>Usuarios y alumnos</h2>
      </header>
      {credenciales.length > 0 && !confirmacion && (
        <ModalCredenciales credenciales={credenciales} finalizar={() => setConfirmacion({ titulo: "Finalizar entrega", mensaje: "¿Has guardado o entregado las credenciales de forma privada?", detalle: "Al finalizar no podrás volver a consultar estas claves.", accion: "Finalizar", ejecutar: cerrarCredenciales })} />
      )}
      {usuarios.error && <p role="alert">{usuarios.error}</p>}
      {subseccion === "menu" ? (
        <>
          {usuarios.cargando && <p role="status">Consultando usuarios…</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 12, marginBottom: 20 }}>
            {[["Alumnos", totalAlumnos], ["Apoderados", totalApoderados], ["Encargados", totalEncargados], ["Administradores", totalAdministradores]].map(([titulo, total]) => (
              <div key={titulo} style={{ background: "#e3ebdf", color: "#193f35", padding: "14px 16px", borderRadius: 12, display: "grid", gap: 6 }}>
                <span>{titulo}</span><strong style={{ fontSize: "1.6rem" }}>{usuarios.cargando || usuarios.error ? "—" : total}</strong>
              </div>
            ))}
          </div>
          <h3 style={{ margin: "0 0 12px" }}>¿Qué deseas hacer?</h3>
          <div className="family-v4-options" style={{ display: "grid", gap: 10 }}>
            {([
              ["nomina", "Nómina de usuarios", "Consultar, buscar y administrar cuentas", "▤"],
              ["registro", "Registrar usuario", "Seleccionar perfil y crear cuentas; carga masiva de alumnos", "＋"],
              ["liquidacion", "Cierre de cuenta del alumno", "Consultar y gestionar la liquidación de saldo", "✓"],
            ] as [PestanaPersonas, string, string, string][]).map(([id, titulo, desc, icono]) => (
              <button key={id} type="button" className="family-v4-option" onClick={() => { if (id === "nomina") { setFiltroRol("TODOS"); setFiltroEstado("TODOS"); setBusquedaUsuario(""); setPaginaUsuario(1); } if (id === "registro") setPerfilRegistro(""); setSubseccion(id); }}>
                <span aria-hidden="true">{icono}</span><span><strong>{titulo}</strong><small>{desc}</small></span><span aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <button type="button" className="back-link secondary" style={{ marginBottom: 16 }} disabled={procesando} onClick={() => (setUsuarioAbierto(null), setSubseccion("menu"))}>← Volver a Usuarios y alumnos</button>
      )}

      {subseccion === "nomina" && (
        <div className="card">
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
            <h3 style={{ margin: 0 }}>Nómina de usuarios</h3>
            <span className="pill-state neutral">
              {usuariosFiltrados.length} visibles
            </span>
          </div>

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
                  setUsuarioAbierto(null);
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
                  setUsuarioAbierto(null);
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
                  setUsuarioAbierto(null);
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

          <div className="edu-nomina-lista">
            {usuariosPaginados.map((u) => (
              <article key={u.id} className="edu-nomina-fila">
                <button type="button" className="edu-nomina-resumen" aria-expanded={usuarioAbierto === u.id}
                  onClick={() => setUsuarioAbierto(actual => actual === u.id ? null : u.id)}>
                  <span className="edu-nomina-nombre">{u.nombreCompleto}</span>
                  <span className="edu-nomina-rol">{u.rol.replace("ROLE_", "").toLowerCase()}</span>
                  <span className={`pill-state ${u.estado === "ACTIVA" ? "" : u.estado === "PRIMER_ACCESO" ? "warn" : "bad"}`}>
                    {u.estado === "PRIMER_ACCESO" ? "Primer acceso" : u.estado === "ACTIVA" ? "Activa" : u.estado === "INACTIVA" ? "Inactiva" : u.estado}
                  </span>
                  <span className="edu-nomina-ver">{usuarioAbierto === u.id ? "Cerrar" : "Gestionar"} <span aria-hidden="true">{usuarioAbierto === u.id ? "−" : "›"}</span></span>
                </button>
                {usuarioAbierto === u.id && <div className="edu-nomina-detalle">
                  <dl><div><dt>RUT</dt><dd>{formatearRutVisual(u.rut)}</dd></div><div><dt>Correo</dt><dd>{u.correo}</dd></div></dl>
                  {u.rol.replace("ROLE_", "") === "ALUMNO" && u.estado !== "INACTIVA" && <p className="edu-nomina-nota">Para inactivar al alumno se requiere un cierre de saldo seguro.</p>}
                  {u.id === usuario?.usuarioId && <p className="edu-nomina-nota">No puedes inactivar tu propia cuenta.</p>}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="btn secondary"
                    disabled={
                      procesando ||
                      !usuario || u.id === usuario.usuarioId ||
                      (u.rol.replace("ROLE_", "") === "ALUMNO" &&
                        u.estado !== "INACTIVA")
                    }
                    title={u.id === usuario?.usuarioId ? "No puedes inactivar tu propia cuenta" : undefined}
                    onClick={() => {
                      if (!usuario || u.id === usuario.usuarioId) return;
                      const reactivando = u.estado === "INACTIVA";
                      setConfirmacion({ titulo: reactivando ? "Reactivar cuenta" : "Inactivar cuenta", mensaje: `¿Deseas ${reactivando ? "reactivar" : "inactivar"} la cuenta de ${u.nombreCompleto}?`, accion: reactivando ? "Reactivar" : "Inactivar", advertencia: !reactivando, ejecutar: () => reactivando ? reactivar(u.id) : inactivar(u.id) });
                    }}
                  >
                    {u.estado === "INACTIVA" ? "Reactivar" : "Inactivar"}
                  </button>
                  <button
                    className="btn"
                    disabled={procesando}
                    onClick={() => setConfirmacion({ titulo: "Restablecer contraseña", mensaje: `¿Deseas restablecer la contraseña de ${u.nombreCompleto}?`, detalle: "Se generará una nueva contraseña temporal, se invalidará la anterior y se cerrarán sus sesiones activas.", accion: "Restablecer", ejecutar: () => restablecer(u.id) })}
                  >
                    Restablecer contraseña
                  </button>
                </div>
                {u.rol.replace("ROLE_", "") === "ALUMNO" && (
                  <GestionVinculos key={u.id} alumnoId={u.id} usuarios={listaUsuarios} recargarUsuarios={usuarios.recargar} />
                )}
                </div>}
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

      {subseccion === "registro" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Registrar usuario</h3>
          <label htmlFor="perfil-registro">Perfil de usuario *</label>
          <select id="perfil-registro" className="input" value={perfilRegistro} disabled={procesando}
            onChange={(e) => {
              const perfil = e.target.value as typeof perfilRegistro;
              setPerfilRegistro(perfil);
              if (perfil === "APODERADO" || perfil === "ENCARGADO") setRol(perfil);
              setFeedbackPersonal(null);
            }}>
            <option value="">Selecciona un perfil</option>
            <option value="ALUMNO">Alumno</option>
            <option value="APODERADO">Apoderado</option>
            <option value="ENCARGADO">Encargado de librería</option>
          </select>
          {perfilRegistro && <details style={{ marginTop: 12 }}>
            <summary>Permisos del perfil</summary>
            <ul>
              {(perfilRegistro === "ALUMNO" ? ["Acceso web desde los 12 años: consultar saldo y gestionar sus propias reservas", "Retiro presencial de materiales"] : perfilRegistro === "APODERADO" ? ["Consultar cuentas de alumnos vinculados", "Realizar abonos y reservas", "Consultar movimientos y notificaciones"] : ["Preparar y entregar reservas", "Registrar entregas y devoluciones", "Consultar existencias y solicitar ajustes"]).map(p => <li key={p}>{p}</li>)}
            </ul>
          </details>}
          <p className="card-desc" style={{ marginTop: 12 }}>Los permisos se asignan según el perfil. Las cuentas de Administrador se crean exclusivamente por EduSaldo.</p>
        </div>
      )}
      {subseccion === "registro" && perfilRegistro === "ALUMNO" && (
        <>
          <AltaAlumnoForm
            crear={crearAlumno}
            procesando={procesando}
            apoderados={listaUsuarios}
            onVerNomina={() => {
              setBusquedaUsuario("");
              setFiltroEstado("TODOS");
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

      {subseccion === "registro" && (perfilRegistro === "APODERADO" || perfilRegistro === "ENCARGADO") && (
        <div className="card">
          <h3>Datos del {perfilRegistro === "APODERADO" ? "apoderado" : "encargado"}</h3>
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

      {subseccion === "liquidacion" && <LiquidacionSaldo usuarios={listaUsuarios} />}
    </section>
  );
}
