import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSesion } from "../context/SesionContext";
import type { Rol } from "../services/auth";

export interface RutaProtegidaProps {
  rolesPermitidos?: readonly Rol[];
  requierePrimerAcceso?: boolean;
}

export function rutaInicioPorRol(rol: Rol): string {
  return rol === "APODERADO" || rol === "ALUMNO"
    ? "/familia/cuenta"
    : "/interno/inicio";
}

/**
 * Guarda de navegación de UX basada en React Router (<Outlet />).
 * La autorización real y criptográfica ocurre en el API Gateway validando el JWT HS256 y la sesión activa.
 */
export function RutaProtegida({
  rolesPermitidos,
  requierePrimerAcceso = false,
}: RutaProtegidaProps) {
  const { usuario, cargando } = useSesion();
  const location = useLocation();

  if (cargando) {
    return (
      <main className="dashboard" aria-live="polite">
        Comprobando sesión…
      </main>
    );
  }

  if (!usuario) {
    return <Navigate to="/acceso" replace state={{ from: location.pathname }} />;
  }

  if (requierePrimerAcceso) {
    if (usuario.estado !== "PRIMER_ACCESO") {
      return <Navigate to={rutaInicioPorRol(usuario.rol)} replace />;
    }
    return <Outlet />;
  }

  if (usuario.estado === "PRIMER_ACCESO") {
    return <Navigate to="/primer-acceso" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to={rutaInicioPorRol(usuario.rol)} replace />;
  }

  return <Outlet />;
}
