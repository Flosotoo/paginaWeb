import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSesion } from "../context/SesionContext";
import type { Rol } from "../services/auth";
import { rutaInicioPorRol } from "./RutaProtegida";

export const MENU_ADMINISTRADOR: readonly [string, string][] = [
  ["inicio", "Inicio"], ["cuenta-libreria", "Cuenta Librería"],
  ["inventario", "Inventario y Valorización"], ["gestion-compras", "Gestión de Compras"],
  ["pagos", "Pagos"], ["personas", "Usuarios y alumnos"],
];
export const MENU_ENCARGADO: readonly [string, string][] = [
  ["inicio", "Inicio"], ["reservas", "Reservas"], ["entregas", "Entrega directa"],
  ["inventario", "Inventario"], ["historial", "Historial"], ["correcciones", "Mis datos"], ["privacidad", "Privacidad"],
];
export const MENU_FAMILIA: readonly [string, string][] = [
  ["cuenta", "Mi Cuenta"], ["catalogo", "Catálogo y Reservas"], ["reservas", "Mis Reservas"],
  ["movimientos", "Movimientos"], ["correcciones", "Mis datos"], ["privacidad", "Privacidad"],
];
export const MENU_ALUMNO: readonly [string, string][] = [
  ["cuenta", "Inicio"], ["catalogo", "Reservar materiales"], ["reservas", "Mis reservas"],
];
export const SECCIONES_INVENTARIO = ["inventario", "gestion-catalogo", "gestion-compras", "inventario-ajustes", "inventario-movimientos"] as const;
export function obtenerMenuPorRol(rol: Rol): readonly [string, string][] {
  if (rol === "APODERADO") return [["cuenta", "Mis hijos"], ["correcciones", "Mis datos"], ["privacidad", "Privacidad"]];
  if (rol === "ALUMNO") return MENU_ALUMNO;
  if (rol === "ADMINISTRADOR") return MENU_ADMINISTRADOR;
  return MENU_ENCARGADO;
}
export function prefijoPortalPorRol(rol: Rol): "/familia" | "/interno" {
  return rol === "APODERADO" || rol === "ALUMNO" ? "/familia" : "/interno";
}
export function LayoutPortal() {
  const { usuario, salir } = useSesion();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  if (!usuario) return null;
  const menuItems = obtenerMenuPorRol(usuario.rol);
  const prefijo = prefijoPortalPorRol(usuario.rol);
  const esAdmin = usuario.rol === "ADMINISTRADOR";
  const irAInicio = () => { setMenuAbierto(false); navigate(rutaInicioPorRol(usuario.rol)); };
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button type="button" className="brand brand-light" onClick={irAInicio} aria-label="EduSaldo inicio" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="brand-mark">e</span><span style={{ color: "white", fontSize: "20px", fontWeight: 700 }}>edu<strong>saldo</strong></span>
          </button>
          {usuario.estado !== "PRIMER_ACCESO" && <>
            <button type="button" className="mobile-nav-toggle" aria-expanded={menuAbierto} aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuAbierto(v => !v)}><span aria-hidden="true">{menuAbierto ? "✕" : "☰"}</span> Menú</button>
            <nav className={`header-nav ${menuAbierto ? "is-open" : ""}`} aria-label="Secciones principales">
              {menuItems.map(([id, texto]) => <NavLink key={id} to={`${prefijo}/${id}`} className={({ isActive }) => (isActive || (id === "inventario" && SECCIONES_INVENTARIO.some(s => (!esAdmin || s !== "gestion-compras") && pathname === `/interno/${s}`)) ? "active" : "")} onClick={() => setMenuAbierto(false)}>{texto}</NavLink>)}
            </nav>
          </>}
          <div className="header-account">
            <span className="user-bubble">{usuario.nombreCompleto?.charAt(0) || "U"}</span>
            <span className="user-name">{usuario.nombreCompleto}</span>
            {esAdmin && usuario.estado !== "PRIMER_ACCESO" && <details style={{ position: "relative" }}><summary style={{ cursor: "pointer", color: "white" }}>Más</summary><div style={{ position: "absolute", right: 0, top: "100%", zIndex: 100, background: "#fffcf7", padding: "12px", minWidth: "180px", borderRadius: "8px", display: "grid", gap: "8px" }}>{[["reservas", "Reservas"], ["correcciones", "Mis datos"], ["privacidad", "Privacidad y seguridad"]].map(([id, texto]) => <NavLink key={id} to={`/interno/${id}`} style={{ color: "#193f35" }} onClick={e => { e.currentTarget.closest("details")?.removeAttribute("open"); setMenuAbierto(false); }}>{texto}</NavLink>)}</div></details>}
            <button className="logout" id="logout" type="button" onClick={() => { setMenuAbierto(false); void salir().catch(() => undefined).finally(() => navigate("/acceso", { replace: true })); }}>Cerrar sesión</button>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}
