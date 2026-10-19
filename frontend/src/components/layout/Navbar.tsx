import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => (location.pathname === path ? 'active' : '');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || 'apoderado';

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          to={role === 'libreria' ? '/libreria' : role === 'administrador' ? '/admin' : role === 'autorizador' ? '/autorizador' : '/'}
          className="brand brand-light"
          aria-label="EduSaldo inicio"
        >
          <span className="brand-mark">
            e<span>·</span>
          </span>
          <span>
            edu<strong>saldo</strong><i>.</i>
          </span>
        </Link>

        <button
          className="mobile-nav-toggle"
          type="button"
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          aria-controls="mobile-main-nav"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span aria-hidden="true">☰</span>
          <span className="mobile-nav-label">Menú</span>
        </button>

        {/* Navegación específica según ROL */}
        <nav
          id="mobile-main-nav"
          className={`header-nav ${mobileOpen ? 'mobile-open' : ''}`}
          aria-label="Navegación principal"
        >
          {role === 'apoderado' && (
            <>
              <Link to="/" className={isActive('/')} onClick={() => setMobileOpen(false)}>
                Mis alumnos
              </Link>
              <Link to="/catalogo" className={isActive('/catalogo')} onClick={() => setMobileOpen(false)}>
                Catálogo y Reservas
              </Link>
              <Link to="/reservas" className={isActive('/reservas')} onClick={() => setMobileOpen(false)}>
                Mis pedidos
              </Link>
              <Link to="/carrito" className={`cart-link ${isActive('/carrito')}`} onClick={() => setMobileOpen(false)} data-testid="cart-btn">
                Carrito {totalItems > 0 && <span className="cart-badge-pill" data-testid="cart-badge">{totalItems}</span>}
              </Link>
            </>
          )}

          {role === 'libreria' && (
            <>
              <Link to="/libreria" className={isActive('/libreria')} onClick={() => setMobileOpen(false)}>
                Inicio
              </Link>
              <Link to="/libreria/reservas" className={isActive('/libreria/reservas')} onClick={() => setMobileOpen(false)}>
                Reservas
              </Link>
              <Link to="/libreria/entrega-directa" className={isActive('/libreria/entrega-directa')} onClick={() => setMobileOpen(false)}>
                Entrega directa
              </Link>
              <Link to="/libreria/inventario" className={isActive('/libreria/inventario')} onClick={() => setMobileOpen(false)}>
                Inventario
              </Link>
              <Link to="/libreria/recepcion-compras" className={isActive('/libreria/recepcion-compras')} onClick={() => setMobileOpen(false)}>
                Recepción compras
              </Link>
              <Link to="/libreria/devoluciones" className={isActive('/libreria/devoluciones')} onClick={() => setMobileOpen(false)}>
                Devoluciones
              </Link>
            </>
          )}

          {role === 'administrador' && (
            <>
              <Link to="/admin" className={isActive('/admin')} onClick={() => setMobileOpen(false)}>
                Inicio
              </Link>
              <Link to="/admin/finanzas" className={isActive('/admin/finanzas')} onClick={() => setMobileOpen(false)}>
                Cuenta Librería
              </Link>
              <Link to="/admin/inventario" className={isActive('/admin/inventario')} onClick={() => setMobileOpen(false)}>
                Inventario
              </Link>
              <Link to="/admin/compras" className={isActive('/admin/compras')} onClick={() => setMobileOpen(false)}>
                Gestión de Compras
              </Link>
              <Link to="/admin/pagos" className={isActive('/admin/pagos')} onClick={() => setMobileOpen(false)}>
                Pagos
              </Link>
              <Link to="/admin/personas" className={isActive('/admin/personas')} onClick={() => setMobileOpen(false)}>
                Personas
              </Link>
            </>
          )}

          {role === 'autorizador' && (
            <>
              <Link to="/autorizador" className={isActive('/autorizador')} onClick={() => setMobileOpen(false)}>
                Inicio
              </Link>
              <Link to="/autorizador/gestion" className={isActive('/autorizador/gestion')} onClick={() => setMobileOpen(false)}>
                Cuenta Librería
              </Link>
              <Link to="/autorizador/autorizaciones" className={isActive('/autorizador/autorizaciones')} onClick={() => setMobileOpen(false)}>
                Autorizaciones pendientes
              </Link>
              <Link to="/autorizador/historial" className={isActive('/autorizador/historial')} onClick={() => setMobileOpen(false)}>
                Historial
              </Link>
            </>
          )}
        </nav>

        <div className="header-account">
          <span className="user-bubble">{user?.initial || 'CP'}</span>
          <span className="user-name">{user?.name || 'Carlos Pérez'}</span>
          <button className="logout" id="logout" type="button" onClick={handleLogout}>
            Salir ↗
          </button>
        </div>
      </div>
    </header>
  );
};
