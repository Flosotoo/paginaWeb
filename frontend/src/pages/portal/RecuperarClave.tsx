import { useState } from "react";
import { useAccion } from "../../hooks/useAccion";
import { authService } from "../../services/auth";
import { mensajeError } from "../../services/api";
export function RecuperarClave() {
  const [correo, setCorreo] = useState("");
  const [token, setToken] = useState("");
  const [clave, setClave] = useState("");
  const [aviso, setAviso] = useState("");
  const { procesando, realizar } = useAccion();
  async function ejecutar(accion: () => Promise<unknown>, mensaje: string) {
    setAviso("");
    try {
      await realizar(async () => {
        await accion();
        setAviso(mensaje);
      });
    } catch (e) {
      setAviso(mensajeError(e));
    }
  }
  return (
    <details>
      <summary>Recuperar contraseña</summary>
      <p>
        El correo es simulado. Solicita el código al administrador del
        establecimiento.
      </p>
      {aviso && <p role="status">{aviso}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ejecutar(
            () => authService.solicitarRecuperacion(correo),
            "Si existe una cuenta habilitada, se registrarán instrucciones de recuperación.",
          );
        }}
      >
        <label>
          Correo de recuperación
          <input
            className="input"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </label>
        <button className="btn" disabled={procesando}>
          Solicitar código
        </button>
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ejecutar(
            () => authService.confirmarRecuperacion(token, clave),
            "Contraseña restablecida. Ya puedes ingresar.",
          );
        }}
      >
        <label>
          Código recibido
          <input
            className="input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </label>
        <label>
          Nueva contraseña de recuperación
          <input
            className="input"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </label>
        <button className="btn" disabled={procesando}>
          Restablecer contraseña
        </button>
      </form>
    </details>
  );
}
