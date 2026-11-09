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

      <AltaAlumnoForm crear={crearAlumno} procesando={procesando} />

      <ImportarNomina importar={importar} procesando={procesando} />

      <GestionVinculos
        usuarios={usuarios.datos ?? []}
        recargarUsuarios={usuarios.recargar}
      />

      <LiquidacionSaldo usuarios={usuarios.datos ?? []} />

      <div className="card">
        <span className="eyebrow">NÓMINA INSTITUCIONAL</span>
        <h3>Usuarios del establecimiento</h3>
        <p className="card-desc">Cuentas activas e inactivas registradas en el establecimiento.</p>
        {usuarios.cargando && <p>Cargando…</p>}

        <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
          {usuarios.datos?.map((u) => (
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
      </div>
    </section>
  );
}
