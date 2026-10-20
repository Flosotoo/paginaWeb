import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HomePage } from '../pages/HomePage';
import { CatalogoPage } from '../pages/CatalogoPage';
import { CarritoPage } from '../pages/CarritoPage';
import { ReservasPage } from '../pages/ReservasPage';
import { AportarSaldoPage } from '../pages/apoderado/AportarSaldoPage';
import { LoginPage } from '../pages/LoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminPersonasPage } from '../pages/admin/AdminPersonasPage';
import { AdminComprasPage } from '../pages/admin/AdminComprasPage';
import { AdminControlPage } from '../pages/admin/AdminControlPage';
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
      {/* Ruta raíz: redirige a /login si no hay sesión, o al dashboard del rol */}
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

      {/* Módulo Apoderado */}
      <Route path="/apoderado" element={!user ? <Navigate to="/login" replace /> : <HomePage />} />
      <Route path="/catalogo" element={!user ? <Navigate to="/login" replace /> : <CatalogoPage />} />
      <Route path="/carrito" element={!user ? <Navigate to="/login" replace /> : <CarritoPage />} />
      <Route path="/reservas" element={!user ? <Navigate to="/login" replace /> : <ReservasPage />} />
      <Route path="/aportar-saldo" element={!user ? <Navigate to="/login" replace /> : <AportarSaldoPage />} />

      {/* Módulo Encargado de Librería (Image 2) */}
      <Route path="/libreria" element={!user ? <Navigate to="/login" replace /> : <LibreriaDashboardPage />} />
      <Route path="/libreria/reservas" element={!user ? <Navigate to="/login" replace /> : <LibreriaReservasPage />} />
      <Route path="/libreria/inventario" element={!user ? <Navigate to="/login" replace /> : <LibreriaInventarioPage />} />
      <Route path="/libreria/entrega-directa" element={!user ? <Navigate to="/login" replace /> : <LibreriaEntregaDirectaPage />} />
      <Route path="/libreria/devoluciones" element={!user ? <Navigate to="/login" replace /> : <LibreriaDevolucionesPage />} />
      <Route path="/libreria/recepcion-compras" element={!user ? <Navigate to="/login" replace /> : <LibreriaRecepcionPage />} />

      {/* Módulo Administrador */}
      <Route path="/admin" element={!user ? <Navigate to="/login" replace /> : <AdminDashboardPage />} />
      <Route path="/admin/personas" element={!user ? <Navigate to="/login" replace /> : <AdminPersonasPage />} />
      <Route path="/admin/compras" element={!user ? <Navigate to="/login" replace /> : <AdminComprasPage />} />
      <Route path="/admin/control" element={!user ? <Navigate to="/login" replace /> : <AdminControlPage />} />
      <Route path="/admin/configuracion" element={!user ? <Navigate to="/login" replace /> : <AdminControlPage />} />

      {/* Módulo Autorizador */}
      <Route path="/autorizador" element={!user ? <Navigate to="/login" replace /> : <AutorizadorDashboardPage />} />

      {/* Login y 404 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
