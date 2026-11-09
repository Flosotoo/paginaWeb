import { useState } from "react";
import { useSesion } from "../../context/SesionContext";
import { useAccion } from "../../hooks/useAccion";
import { authService } from "../../services/auth";
import { mensajeError } from "../../services/api";
export function CambiarClave() {
  const { usuario, ingresar } = useSesion();
  const { procesando, realizar } = useAccion();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [aviso, setAviso] = useState("");
  return (
    <div className="card">
      <span className="eyebrow">SEGURIDAD DE ACCESO</span>
      <h3>Cambiar contraseña</h3>
      <p className="card-desc">Ingresa tu contraseña actual y define una nueva clave segura.</p>
      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "14px" }}>{aviso}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAviso("");
          void realizar(async () => {
            await authService.cambiarPassword(usuario!.correo, actual, nueva);
            await ingresar(usuario!.correo, nueva);
            setActual("");
            setNueva("");
            setAviso("Contraseña actualizada.");
          }).catch((error) => setAviso(mensajeError(error)));
        }}
      >
        <div className="form-grid-2">
          <label>
            Contraseña actual
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              required
            />
          </label>
          <label>
            Nueva contraseña
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="btn" disabled={procesando}>
            Cambiar contraseña
          </button>
        </div>
      </form>
    </div>
  );
}
