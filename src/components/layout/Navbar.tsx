import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  currentRole?: string;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => (location.pathname === path ? 'active' : '');

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand brand-light" aria-label="EduSaldo inicio">
          <span className="brand-mark">
            e<span>·</span>
          </span>
          <span>
            edu<strong>saldo</strong><i>.</i>
          </span>
        </Link>

        <nav id="mobile-main-nav" className="header-nav" aria-label="Navegación principal">
          <Link to="/" className={isActive('/')}>
            Mis alumnos
          </Link>
          <Link to="/catalogo" className={isActive('/catalogo')}>
            Catálogo y Reservas
          </Link>
          <Link to="/reservas" className={isActive('/reservas')}>
            Mis pedidos
          </Link>
          <Link to="/admin" className={isActive('/admin')}>
            Administración
          </Link>
          <Link to="/carrito" className={`cart-link ${isActive('/carrito')}`} data-testid="cart-btn">
            Carrito {totalItems > 0 && <span className="cart-badge-pill" data-testid="cart-badge">{totalItems}</span>}
          </Link>
        </nav>

        <div className="header-account">
          <span className="user-bubble">CP</span>
          <span className="user-name">Carlos Pérez</span>
          <button className="logout" id="logout" type="button" onClick={handleLogout}>
            Salir ↗
          </button>
        </div>
      </div>
    </header>
  );
};
