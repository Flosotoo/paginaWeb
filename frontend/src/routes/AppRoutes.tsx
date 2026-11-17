import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RutaProtegida } from '../components/auth/RutaProtegida';
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
import { AdminFinanzasPage } from '../pages/admin/AdminFinanzasPage';
import { AdminInventarioPage } from '../pages/admin/AdminInventarioPage';
import { AdminPagosPage } from '../pages/admin/AdminPagosPage';
import { LibreriaDashboardPage } from '../pages/libreria/LibreriaDashboardPage';
import { LibreriaReservasPage } from '../pages/libreria/LibreriaReservasPage';
import { LibreriaInventarioPage } from '../pages/libreria/LibreriaInventarioPage';
import { LibreriaEntregaDirectaPage } from '../pages/libreria/LibreriaEntregaDirectaPage';
import { LibreriaDevolucionesPage } from '../pages/libreria/LibreriaDevolucionesPage';
import { LibreriaRecepcionPage } from '../pages/libreria/LibreriaRecepcionPage';
import { AutorizadorDashboardPage } from '../pages/autorizador/AutorizadorDashboardPage';
import { AutorizadorGestionPage } from '../pages/autorizador/AutorizadorGestionPage';
import { AutorizadorAutorizacionesPage } from '../pages/autorizador/AutorizadorAutorizacionesPage';
import { AutorizadorHistorialPage } from '../pages/autorizador/AutorizadorHistorialPage';
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
      <Route path="/apoderado" element={<RutaProtegida roles={['apoderado']}><HomePage /></RutaProtegida>} />
      <Route path="/catalogo" element={<RutaProtegida roles={['apoderado']}><CatalogoPage /></RutaProtegida>} />
      <Route path="/carrito" element={<RutaProtegida roles={['apoderado']}><CarritoPage /></RutaProtegida>} />
      <Route path="/reservas" element={<RutaProtegida roles={['apoderado']}><ReservasPage /></RutaProtegida>} />
      <Route path="/aportar-saldo" element={<RutaProtegida roles={['apoderado']}><AportarSaldoPage /></RutaProtegida>} />

      {/* Módulo Encargado de Librería */}
      <Route path="/libreria" element={<RutaProtegida roles={['libreria']}><LibreriaDashboardPage /></RutaProtegida>} />
      <Route path="/libreria/reservas" element={<RutaProtegida roles={['libreria']}><LibreriaReservasPage /></RutaProtegida>} />
      <Route path="/libreria/inventario" element={<RutaProtegida roles={['libreria']}><LibreriaInventarioPage /></RutaProtegida>} />
      <Route path="/libreria/entrega-directa" element={<RutaProtegida roles={['libreria']}><LibreriaEntregaDirectaPage /></RutaProtegida>} />
      <Route path="/libreria/devoluciones" element={<RutaProtegida roles={['libreria']}><LibreriaDevolucionesPage /></RutaProtegida>} />
      <Route path="/libreria/recepcion-compras" element={<RutaProtegida roles={['libreria']}><LibreriaRecepcionPage /></RutaProtegida>} />

      {/* Módulo Administrador */}
      <Route path="/admin" element={<RutaProtegida roles={['administrador']}><AdminDashboardPage /></RutaProtegida>} />
      <Route path="/admin/personas" element={<RutaProtegida roles={['administrador']}><AdminPersonasPage /></RutaProtegida>} />
      <Route path="/admin/finanzas" element={<RutaProtegida roles={['administrador']}><AdminFinanzasPage /></RutaProtegida>} />
      <Route path="/admin/inventario" element={<RutaProtegida roles={['administrador']}><AdminInventarioPage /></RutaProtegida>} />
      <Route path="/admin/compras" element={<RutaProtegida roles={['administrador']}><AdminComprasPage /></RutaProtegida>} />
      <Route path="/admin/pagos" element={<RutaProtegida roles={['administrador']}><AdminPagosPage /></RutaProtegida>} />
      <Route path="/admin/control" element={<RutaProtegida roles={['administrador']}><AdminControlPage /></RutaProtegida>} />
      <Route path="/admin/configuracion" element={<RutaProtegida roles={['administrador']}><AdminControlPage /></RutaProtegida>} />

      {/* Módulo Autorizador */}
      <Route path="/autorizador" element={<RutaProtegida roles={['autorizador']}><AutorizadorDashboardPage /></RutaProtegida>} />
      <Route path="/autorizador/gestion" element={<RutaProtegida roles={['autorizador']}><AutorizadorGestionPage /></RutaProtegida>} />
      <Route path="/autorizador/autorizaciones" element={<RutaProtegida roles={['autorizador']}><AutorizadorAutorizacionesPage /></RutaProtegida>} />
      <Route path="/autorizador/historial" element={<RutaProtegida roles={['autorizador']}><AutorizadorHistorialPage /></RutaProtegida>} />

      {/* Login y 404 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
