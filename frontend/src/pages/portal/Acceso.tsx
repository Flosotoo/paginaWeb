import { RecuperarClave } from "./RecuperarClave";
import { AvisoTexto } from "./Privacidad";
import { useState, type FormEvent } from "react";
import { useSesion } from "../../context/SesionContext";
import { useAccion } from "../../hooks/useAccion";
import { authService } from "../../services/auth";
import { mensajeError } from "../../services/api";

export function Acceso() {
  const { ingresar, error: errorSesion } = useSesion();
  const [identificador, setIdentificador] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const { procesando, realizar } = useAccion();
  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setError("");
    try {
      await realizar(() => ingresar(identificador, clave));
    } catch (e) {
      setError(mensajeError(e));
    }
  }
  return (
    <main className="login">
      <section className="login-visual">
        <div className="brand brand-light" aria-label="EduSaldo inicio">
          <span className="brand-mark">e</span>
          <span>
            edu<strong>saldo</strong>
          </span>
        </div>

        <div className="visual-copy">
          <span className="eyebrow pale">EDUSALDO · TU ESPACIO FAMILIAR</span>
          <h1>
            Todo lo que acompaña
            <br />
            su aprendizaje,
            <br />
            <em>más cerca de ti.</em>
          </h1>
        </div>

        <span className="visual-foot">EduSaldo · Proyecto académico</span>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <span className="eyebrow">ACCESO A TU CUENTA</span>
          <h2>
            Ingresa para apoyar
            <br />
            <em>su día escolar.</em>
          </h2>
          <p className="muted">
            Consulta los saldos y movimientos de los estudiantes a tu cargo desde un solo lugar.
          </p>
          <form onSubmit={enviar}>
            <div className="field">
              <label htmlFor="identificador">Correo o RUT</label>
              <input
                className="input"
                id="identificador"
                autoComplete="username"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="clave">Contraseña</label>
              <input
                className="input"
                id="clave"
                type="password"
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
              />
            </div>
            {(error || errorSesion) && (
              <p role="alert">{error || errorSesion}</p>
            )}
            <button className="btn btn-wide" type="submit" disabled={procesando}>
              {procesando ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
          <RecuperarClave />
          <details className="demo" style={{ marginTop: "18px" }}>
            <summary>Ver cuentas de demostración</summary>
            <div style={{ marginTop: "10px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "11px", color: "var(--muted)" }}>
                Haz clic en una cuenta para autocompletar:
              </p>
              <div style={{ display: "grid", gap: "6px" }}>
                <code
                  style={{ cursor: "pointer", padding: "4px 6px", background: "#fff", borderRadius: "6px" }}
                  onClick={() => { setIdentificador("admin@colegio.cl"); setClave("admin123"); }}
                  title="Clic para autocompletar"
                >
                  <strong>Admin:</strong> admin@colegio.cl / admin123
                </code>
                <code
                  style={{ cursor: "pointer", padding: "4px 6px", background: "#fff", borderRadius: "6px" }}
                  onClick={() => { setIdentificador("libreria@colegio.cl"); setClave("Edu123456"); }}
                  title="Clic para autocompletar"
                >
                  <strong>Encargado:</strong> libreria@colegio.cl / Edu123456
                </code>
                <code
                  style={{ cursor: "pointer", padding: "4px 6px", background: "#fff", borderRadius: "6px" }}
                  onClick={() => { setIdentificador("carlos.perez@gmail.com"); setClave("Edu123456"); }}
                  title="Clic para autocompletar"
                >
                  <strong>Apoderado:</strong> carlos.perez@gmail.com / Edu123456
                </code>
                <code
                  style={{ cursor: "pointer", padding: "4px 6px", background: "#fff", borderRadius: "6px" }}
                  onClick={() => { setIdentificador("tomas.perez@alumnos.colegio.cl"); setClave("Edu123456"); }}
                  title="Clic para autocompletar"
                >
                  <strong>Alumno (≥12):</strong> tomas.perez@alumnos.colegio.cl / Edu123456
                </code>
                <code
                  style={{ cursor: "pointer", padding: "4px 6px", background: "#fff", borderRadius: "6px" }}
                  onClick={() => { setIdentificador("admin@sanagustin.cl"); setClave("admin123"); }}
                  title="Clic para autocompletar"
                >
                  <strong>Admin (Colegio 2):</strong> admin@sanagustin.cl / admin123
                </code>
              </div>
            </div>
          </details>
        </div>
      </section>
    </main>
  );
}
export function PrimerAcceso() {
  const { usuario, ingresar } = useSesion();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState("");
  const { procesando, realizar } = useAccion();
  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setError("");
    try {
      await realizar(async () => {
        await authService.cambiarPassword(usuario!.correo, actual, nueva);
        await ingresar(usuario!.correo, nueva);
      });
    } catch (e) {
      setError(mensajeError(e));
    }
  }
  return (
    <main className="dashboard">
      <section className="account-section">
        <h1>Cambia tu contraseña</h1>
        <p>Para continuar, reemplaza tu contraseña temporal.</p>
        <AvisoTexto />
        <p>Podrás aceptar el aviso expresamente después de ingresar.</p>
        <form onSubmit={enviar}>
          <label>
            Contraseña actual{" "}
            <input
              className="input"
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              required
            />
          </label>
          <label>
            Nueva contraseña{" "}
            <input
              className="input"
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              required
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="btn" disabled={procesando}>
            Guardar contraseña
          </button>
        </form>
      </section>
    </main>
  );
}
