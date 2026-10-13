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
  const role = user?.role || 'apoderado';

  return (
    <Routes>
      {/* Ruta raíz inteligente: redirige automáticamente al panel del rol activo */}
      <Route
        path="/"
        element={
          role === 'libreria' ? (
            <Navigate to="/libreria" replace />
          ) : role === 'administrador' ? (
            <Navigate to="/admin" replace />
          ) : role === 'autorizador' ? (
            <Navigate to="/autorizador" replace />
          ) : (
            <HomePage />
          )
        }
      />

      {/* Rutas Módulo Apoderado */}
      <Route path="/apoderado" element={<HomePage />} />
      <Route path="/catalogo" element={<CatalogoPage />} />
      <Route path="/carrito" element={<CarritoPage />} />
      <Route path="/reservas" element={<ReservasPage />} />

      {/* Rutas Módulo Encargado de Librería (Image 2) */}
      <Route path="/libreria" element={<LibreriaDashboardPage />} />
      <Route path="/libreria/reservas" element={<LibreriaReservasPage />} />
      <Route path="/libreria/inventario" element={<LibreriaInventarioPage />} />
      <Route path="/libreria/entrega-directa" element={<LibreriaEntregaDirectaPage />} />
      <Route path="/libreria/devoluciones" element={<LibreriaDevolucionesPage />} />
      <Route path="/libreria/recepcion-compras" element={<LibreriaRecepcionPage />} />

      {/* Rutas Módulo Administrador */}
      <Route path="/admin" element={<AdminDashboardPage />} />

      {/* Rutas Módulo Autorizador (Segunda firma) */}
      <Route path="/autorizador" element={<AutorizadorDashboardPage />} />

      {/* Acceso y 404 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
