import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HomePage } from '../pages/HomePage';
import { CatalogoPage } from '../pages/CatalogoPage';
import { CarritoPage } from '../pages/CarritoPage';
import { ReservasPage } from '../pages/ReservasPage';
import { LoginPage } from '../pages/LoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { LibreriaDashboardPage } from '../pages/libreria/LibreriaDashboardPage';
import { LibreriaReservasPage } from '../pages/libreria/LibreriaReservasPage';
import { LibreriaInventarioPage } from '../pages/libreria/LibreriaInventarioPage';
import { LibreriaEntregaDirectaPage } from '../pages/libreria/LibreriaEntregaDirectaPage';
import { LibreriaDevolucionesPage } from '../pages/libreria/LibreriaDevolucionesPage';
import { LibreriaRecepcionPage } from '../pages/libreria/LibreriaRecepcionPage';
import { AutorizadorDashboardPage } from '../pages/autorizador/AutorizadorDashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Ruta raíz: si no hay sesión, obliga a ir a /login. Si hay sesión, va al panel de su rol */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.role === 'libreria' ? (
            <Navigate to="/libreria" replace />
          ) : user.role === 'administrador' ? (
            <Navigate to="/admin" replace />
          ) : user.role === 'autorizador' ? (
            <Navigate to="/autorizador" replace />
          ) : (
            <HomePage />
          )
        }
      />

      {/* Rutas Módulo Apoderado (protegidas) */}
      <Route
        path="/apoderado"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'apoderado' ? <Navigate to="/" replace /> : <HomePage />}
      />
      <Route
        path="/catalogo"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'apoderado' ? <Navigate to="/" replace /> : <CatalogoPage />}
      />
      <Route
        path="/carrito"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'apoderado' ? <Navigate to="/" replace /> : <CarritoPage />}
      />
      <Route
        path="/reservas"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'apoderado' ? <Navigate to="/" replace /> : <ReservasPage />}
      />

      {/* Rutas Módulo Encargado de Librería (protegidas - Image 2) */}
      <Route
        path="/libreria"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'libreria' ? <Navigate to="/" replace /> : <LibreriaDashboardPage />}
      />
      <Route
        path="/libreria/reservas"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'libreria' ? <Navigate to="/" replace /> : <LibreriaReservasPage />}
      />
      <Route
        path="/libreria/inventario"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'libreria' ? <Navigate to="/" replace /> : <LibreriaInventarioPage />}
      />
      <Route
        path="/libreria/entrega-directa"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'libreria' ? <Navigate to="/" replace /> : <LibreriaEntregaDirectaPage />}
      />
      <Route
        path="/libreria/devoluciones"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'libreria' ? <Navigate to="/" replace /> : <LibreriaDevolucionesPage />}
      />
      <Route
        path="/libreria/recepcion-compras"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'libreria' ? <Navigate to="/" replace /> : <LibreriaRecepcionPage />}
      />

      {/* Rutas Módulo Administrador (protegidas) */}
      <Route
        path="/admin"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'administrador' ? <Navigate to="/" replace /> : <AdminDashboardPage />}
      />

      {/* Rutas Módulo Autorizador (protegidas) */}
      <Route
        path="/autorizador"
        element={!user ? <Navigate to="/login" replace /> : user.role !== 'autorizador' ? <Navigate to="/" replace /> : <AutorizadorDashboardPage />}
      />

      {/* Acceso público y 404 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
