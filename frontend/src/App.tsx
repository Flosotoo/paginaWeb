import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { SesionProvider, useSesion } from "./context/SesionContext";
import type { Rol } from "./services/auth";
import { Acceso, PrimerAcceso } from "./pages/portal/Acceso";
import { RecuperarClave } from "./pages/portal/RecuperarClave";
import { PortalFamilia } from "./pages/portal/PortalFamilia";
import { PortalInterno } from "./pages/portal/PortalInterno";
import {
  LayoutPortal,
  MENU_ADMINISTRADOR,
  MENU_ENCARGADO,
  MENU_FAMILIA,
  MENU_ALUMNO,
  SECCIONES_INVENTARIO,
  prefijoPortalPorRol,
} from "./routes/LayoutPortal";
import { RutaProtegida, rutaInicioPorRol } from "./routes/RutaProtegida";
import "../assets/css/style.css";
import "./portal.css";

const SECCIONES_ADMIN_ADICIONALES = [
  "personas",
  "reservas",
  "configuracion",
  "auditoria",
  "correcciones",
  "privacidad",
] as const;

export const SECCIONES_POR_ROL: Record<Rol, readonly string[]> = {
  ADMINISTRADOR: [
    ...MENU_ADMINISTRADOR.map(([id]) => id),
    ...SECCIONES_ADMIN_ADICIONALES,
    ...SECCIONES_INVENTARIO.filter(id => id !== "inventario"),
  ],
  ENCARGADO: [...MENU_ENCARGADO.map(([id]) => id), ...SECCIONES_INVENTARIO.filter(id => id !== "inventario")],
  APODERADO: [...MENU_FAMILIA.map(([id]) => id), "opciones", "abonar", "notificaciones"],
  ALUMNO: MENU_ALUMNO.map(([id]) => id),
};

export function resolverSeccionPermitida(rol: Rol, solicitada: string): string {
  const permitidas = SECCIONES_POR_ROL[rol];
  const limpia = solicitada
    .replace(/^#\/?/, "")
    .replace(/^(familia|interno)\//, "")
    .trim();
  return permitidas.includes(limpia) ? limpia : permitidas[0];
}

function RutaAccesoPublico() {
  const { usuario, cargando } = useSesion();
  if (cargando) {
    return (
      <main className="dashboard" aria-live="polite">
        Comprobando sesión…
      </main>
    );
  }
  if (usuario) {
    return (
      <Navigate
        to={
          usuario.estado === "PRIMER_ACCESO"
            ? "/primer-acceso"
            : rutaInicioPorRol(usuario.rol)
        }
        replace
      />
    );
  }
  return <Acceso />;
}

function VistaSeccionFamilia() {
  const { usuario } = useSesion();
  const { seccion = "cuenta" } = useParams<{ seccion: string }>();
  const navigate = useNavigate();

  if (!usuario) return null;
  const permitida = resolverSeccionPermitida(usuario.rol, seccion);
  if (permitida !== seccion) {
    return <Navigate to={`/familia/${permitida}`} replace />;
  }

  return (
    <PortalFamilia
      seccion={permitida}
      setSeccion={(nueva) =>
        navigate(`/familia/${resolverSeccionPermitida(usuario.rol, nueva)}`)
      }
    />
  );
}

function VistaSeccionInterna() {
  const { usuario } = useSesion();
  const { seccion = "inicio" } = useParams<{ seccion: string }>();
  const navigate = useNavigate();

  if (!usuario) return null;
  const permitida = resolverSeccionPermitida(usuario.rol, seccion);
  if (permitida !== seccion) {
    return <Navigate to={`/interno/${permitida}`} replace />;
  }

  return (
    <PortalInterno
      seccion={permitida}
      setSeccion={(nueva) =>
        navigate(`/interno/${resolverSeccionPermitida(usuario.rol, nueva)}`)
      }
    />
  );
}

function RedireccionRaizOCodigoLegado() {
  const { usuario, cargando } = useSesion();
  const { legado = "" } = useParams<{ legado: string }>();

  if (cargando) {
    return (
      <main className="dashboard" aria-live="polite">
        Comprobando sesión…
      </main>
    );
  }
  if (!usuario) {
    return <Navigate to="/acceso" replace />;
  }
  if (usuario.estado === "PRIMER_ACCESO") {
    return <Navigate to="/primer-acceso" replace />;
  }
  const seccion = resolverSeccionPermitida(usuario.rol, legado);
  return (
    <Navigate to={`${prefijoPortalPorRol(usuario.rol)}/${seccion}`} replace />
  );
}

export function Aplicacion() {
  return (
    <Routes>
      <Route path="/acceso" element={<RutaAccesoPublico />} />
      <Route
        path="/recuperar"
        element={
          <main className="dashboard">
            <section className="account-section">
              <RecuperarClave />
            </section>
          </main>
        }
      />

      <Route element={<RutaProtegida requierePrimerAcceso />}>
        <Route path="/primer-acceso" element={<LayoutPortal />}>
          <Route index element={<PrimerAcceso />} />
        </Route>
      </Route>

      <Route
        element={
          <RutaProtegida rolesPermitidos={["APODERADO", "ALUMNO"]} />
        }
      >
        <Route path="/familia" element={<LayoutPortal />}>
          <Route index element={<Navigate to="/familia/cuenta" replace />} />
          <Route path=":seccion" element={<VistaSeccionFamilia />} />
        </Route>
      </Route>

      <Route
        element={
          <RutaProtegida rolesPermitidos={["ADMINISTRADOR", "ENCARGADO"]} />
        }
      >
        <Route path="/interno" element={<LayoutPortal />}>
          <Route index element={<Navigate to="/interno/inicio" replace />} />
          <Route path=":seccion" element={<VistaSeccionInterna />} />
        </Route>
      </Route>

      <Route path="/" element={<RedireccionRaizOCodigoLegado />} />
      <Route path="/:legado" element={<RedireccionRaizOCodigoLegado />} />
      <Route path="*" element={<RedireccionRaizOCodigoLegado />} />
    </Routes>
  );
}

export function App() {
  return (
    <SesionProvider>
      <HashRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Aplicacion />
      </HashRouter>
    </SesionProvider>
  );
}

export default App;
