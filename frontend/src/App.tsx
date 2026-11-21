
import { useState, useEffect } from "react";
import { SesionProvider, useSesion } from "./context/SesionContext";
import { Acceso, PrimerAcceso } from "./pages/portal/Acceso";
import { PortalFamilia } from "./pages/portal/PortalFamilia";
import { PortalInterno } from "./pages/portal/PortalInterno";
import "../assets/css/style.css";
import "./portal.css";

// Menú original del Administrador: EduSaldo Etapa 38.
const MENU_ADMINISTRADOR: string[][] = [
  ["inicio", "Inicio"],
  ["cuenta-libreria", "Cuenta Librería"],
  ["inventario", "Inventario"],
  ["gestion-compras", "Gestión de Compras"],
  ["pagos", "Pagos"],
  ["configuracion", "Configuración"],
];

// Secciones adicionales que conservamos durante la migración.
// No aparecen en el menú principal del Administrador.
const SECCIONES_ADMIN_ADICIONALES = [
  "personas",
  "reservas",
  "gestion-catalogo",
  "auditoria",
  "correcciones",
  "privacidad",
];

const MENU_ENCARGADO: string[][] = [
  ["inicio", "Inicio"],
  ["reservas", "Reservas"],
  ["entregas", "Entrega directa"],
  ["inventario", "Inventario"],
  ["gestion-catalogo", "Catálogo y stock"],
  ["historial", "Historial"],
  ["correcciones", "Mis datos"],
  ["privacidad", "Privacidad"],
];

const MENU_FAMILIA: string[][] = [
  ["cuenta", "Mi Cuenta"],
  ["catalogo", "Catálogo y Reservas"],
  ["reservas", "Mis Reservas"],
  ["movimientos", "Movimientos"],
  ["correcciones", "Mis datos"],
  ["privacidad", "Privacidad"],
];

function esRolFamilia(rol: string): boolean {
  return ["APODERADO", "ALUMNO"].includes(rol);
}

function obtenerMenu(rol: string): string[][] {
  if (esRolFamilia(rol)) {
    return MENU_FAMILIA;
  }

  if (rol === "ADMINISTRADOR") {
    return MENU_ADMINISTRADOR;
  }

  return MENU_ENCARGADO;
}

function obtenerSeccionesPermitidas(rol: string): string[] {
  const menu = obtenerMenu(rol);
  const secciones = menu.map(([id]) => id);

  if (rol === "ADMINISTRADOR") {
    return [...secciones, ...SECCIONES_ADMIN_ADICIONALES];
  }

  return secciones;
}

function obtenerSeccionInicial(rol: string): string {
  const hash = window.location.hash.replace("#", "");
  const permitidas = obtenerSeccionesPermitidas(rol);

  if (permitidas.includes(hash)) {
    return hash;
  }

  return esRolFamilia(rol) ? "cuenta" : "inicio";
}

function Aplicacion() {
  const { usuario, cargando, salir } = useSesion();

  const [seccion, setSeccionState] = useState<string>("inicio");
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);

  useEffect(() => {
    if (!usuario) {
      return;
    }

    const inicial = obtenerSeccionInicial(usuario.rol);

    setSeccionState(inicial);
    window.location.hash = inicial;
    setMenuAbierto(false);
  }, [usuario?.usuarioId, usuario?.rol]);

  useEffect(() => {
    const onHashChange = () => {
      if (!usuario) {
        return;
      }

      const hash = window.location.hash.replace("#", "");
      const permitidas = obtenerSeccionesPermitidas(usuario.rol);

      if (permitidas.includes(hash)) {
        setSeccionState(hash);
      } else {
        const inicial = esRolFamilia(usuario.rol)
          ? "cuenta"
          : "inicio";

        setSeccionState(inicial);
        window.location.hash = inicial;
      }
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [usuario?.usuarioId, usuario?.rol]);

  const setSeccion = (nueva: string) => {
    if (!usuario) {
      return;
    }

    const permitidas = obtenerSeccionesPermitidas(usuario.rol);

    if (!permitidas.includes(nueva)) {
      return;
    }

    setSeccionState(nueva);
    window.location.hash = nueva;
    setMenuAbierto(false);
  };

  if (cargando) {
    return (
      <main className="dashboard" aria-live="polite">
        Comprobando sesión…
      </main>
    );
  }

  if (!usuario) {
    return <Acceso />;
  }

  const menuItems = obtenerMenu(usuario.rol);

  const irAInicio = () => {
    setSeccion(
      esRolFamilia(usuario.rol) ? "cuenta" : "inicio"
    );
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button
            type="button"
            className="brand brand-light"
            onClick={irAInicio}
            aria-label="EduSaldo inicio"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span className="brand-mark">e</span>

            <span
              style={{
                color: "white",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              edu<strong>saldo</strong>
            </span>
          </button>

          {usuario.estado !== "PRIMER_ACCESO" && (
            <>
              <button
                type="button"
                className="mobile-nav-toggle"
                aria-expanded={menuAbierto}
                aria-label={
                  menuAbierto ? "Cerrar menú" : "Abrir menú"
                }
                onClick={() => setMenuAbierto(!menuAbierto)}
              >
                <span aria-hidden="true">
                  {menuAbierto ? "✕" : "☰"}
                </span>{" "}
                Menú
              </button>

              <nav
                className={`header-nav ${
                  menuAbierto ? "is-open" : ""
                }`}
                aria-label="Secciones principales"
              >
                {menuItems.map(([id, texto]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className={
                      seccion === id ? "active" : ""
                    }
                    aria-current={
                      seccion === id ? "page" : undefined
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      setSeccion(id);
                    }}
                  >
                    {texto}
                  </a>
                ))}
              </nav>
            </>
          )}

          <div className="header-account">
            <span className="user-bubble">
              {usuario.nombreCompleto?.charAt(0) || "U"}
            </span>

            <span className="user-name">
              {usuario.nombreCompleto}
            </span>

            <button
              className="logout"
              id="logout"
              type="button"
              onClick={() => {
                window.location.hash = "";
                void salir().catch(() => undefined);
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {usuario.estado === "PRIMER_ACCESO" ? (
        <PrimerAcceso />
      ) : esRolFamilia(usuario.rol) ? (
        <PortalFamilia
          seccion={seccion}
          setSeccion={setSeccion}
        />
      ) : (
        <PortalInterno
          seccion={seccion}
          setSeccion={setSeccion}
        />
      )}
    </>
  );
}

export function App() {
  return (
    <SesionProvider>
      <Aplicacion />
    </SesionProvider>
  );
}

export default App;
