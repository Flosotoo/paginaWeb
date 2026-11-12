import { useState, useEffect } from "react";
import { SesionProvider, useSesion } from "./context/SesionContext";
import { Acceso, PrimerAcceso } from "./pages/portal/Acceso";
import { PortalFamilia } from "./pages/portal/PortalFamilia";
import { PortalInterno } from "./pages/portal/PortalInterno";
import "../assets/css/style.css";
import "./portal.css";

function Aplicacion() {
  const { usuario, cargando, salir } = useSesion();

  const getInitialSeccion = (rol?: string) => {
    const hash = window.location.hash.replace("#", "");
    const rolActual = rol ?? usuario?.rol;
    if (rolActual === "ADMINISTRADOR") {
      const adminTabs = [
        "inicio",
        "inventario",
        "personas",
        "reservas",
        "gestion-catalogo",
        "auditoria",
        "correcciones",
        "privacidad",
      ];
      if (adminTabs.includes(hash)) return hash;
      return "inicio";
    }
    if (rolActual === "ENCARGADO") {
      const encTabs = [
        "inicio",
        "reservas",
        "entregas",
        "inventario",
        "gestion-catalogo",
        "historial",
        "correcciones",
        "privacidad",
      ];
      if (encTabs.includes(hash)) return hash;
      return "inicio";
    }
    const apoTabs = [
      "cuenta",
      "catalogo",
      "reservas",
      "movimientos",
      "correcciones",
      "privacidad",
    ];
    if (apoTabs.includes(hash)) return hash;
    return "cuenta";
  };

  const [seccion, setSeccionState] = useState<string>("inicio");
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);

  useEffect(() => {
    if (usuario) {
      const inicial = getInitialSeccion(usuario.rol);
      setSeccionState(inicial);
      window.location.hash = inicial;
    }
  }, [usuario?.usuarioId, usuario?.rol]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setSeccionState(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setSeccion = (nueva: string) => {
    setSeccionState(nueva);
    window.location.hash = nueva;
  };

  if (cargando)
    return (
      <main className="dashboard" aria-live="polite">
        Comprobando sesión…
      </main>
    );

  if (!usuario) return <Acceso />;

  const menuItems = ["APODERADO", "ALUMNO"].includes(usuario.rol)
    ? [
        ["cuenta", "Mi Cuenta"],
        ["catalogo", "Catálogo y Reservas"],
        ["reservas", "Mis Reservas"],
        ["movimientos", "Movimientos"],
        ["correcciones", "Mis datos"],
        ["privacidad", "Privacidad"],
      ]
    : usuario.rol === "ADMINISTRADOR"
    ? [
        ["inicio", "Inicio"],
        ["inventario", "Inventario"],
        ["personas", "Personas"],
        ["reservas", "Reservas"],
        ["gestion-catalogo", "Catálogo y stock"],
        ["auditoria", "Auditoría"],
        ["correcciones", "Mis datos"],
        ["privacidad", "Privacidad"],
      ]
    : [
        ["inicio", "Inicio"],
        ["reservas", "Reservas"],
        ["entregas", "Entrega directa"],
        ["inventario", "Inventario"],
        ["gestion-catalogo", "Catálogo y stock"],
        ["historial", "Historial"],
        ["correcciones", "Mis datos"],
        ["privacidad", "Privacidad"],
      ];

  const irAInicio = () => {
    setSeccion(["APODERADO", "ALUMNO"].includes(usuario.rol) ? "cuenta" : "inicio");
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
            <span style={{ color: "white", fontSize: "20px", fontWeight: 700 }}>
              edu<strong>saldo</strong>
            </span>
          </button>

          {usuario.estado !== "PRIMER_ACCESO" && (
            <>
              <button
                type="button"
                className="mobile-nav-toggle"
                aria-expanded={menuAbierto}
                aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                onClick={() => setMenuAbierto(!menuAbierto)}
              >
                <span aria-hidden="true">{menuAbierto ? "✕" : "☰"}</span> Menú
              </button>

              <nav className={`header-nav ${menuAbierto ? "is-open" : ""}`} aria-label="Secciones principales">
                {menuItems.map(([id, texto]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className={seccion === id ? "active" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setSeccion(id);
                      setMenuAbierto(false);
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
            <span className="user-name">{usuario.nombreCompleto}</span>
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
      ) : ["APODERADO", "ALUMNO"].includes(usuario.rol) ? (
        <PortalFamilia seccion={seccion} setSeccion={setSeccion} />
      ) : (
        <PortalInterno seccion={seccion} setSeccion={setSeccion} />
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
