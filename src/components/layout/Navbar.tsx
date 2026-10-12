import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const location = useLocation();

  const isActive = (path: string) => (location.pathname === path ? 'active fw-bold' : '');

  return (
    <header className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div className="container">
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
          <img
            src="/assets/img/materiales-escolares.svg"
            alt="EduSaldo"
            height="36"
            className="d-inline-block"
          />
          <div className="lh-1 text-start">
            <span className="fw-bold fs-5 d-block text-white">EduSaldo</span>
            <small className="text-muted text-uppercase" style={{ fontSize: '0.65rem' }}>
              Librería Escolar Digital
            </small>
          </div>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarEduSaldo"
          aria-controls="navbarEduSaldo"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarEduSaldo">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            <li className="nav-item">
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                Inicio
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/catalogo" className={`nav-link ${isActive('/catalogo')}`}>
                Catálogo
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/reservas" className={`nav-link ${isActive('/reservas')}`}>
                Mis Reservas
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
                Administración
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            <Link to="/carrito" className="btn btn-outline-light position-relative" data-testid="cart-btn">
              🛒 Carrito
              {totalItems > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  data-testid="cart-badge"
                >
                  {totalItems}
                </span>
              )}
            </Link>

            <Link to="/login" className="btn btn-success btn-sm">
              Mi Cuenta
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
