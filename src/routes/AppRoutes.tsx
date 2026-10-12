import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { CatalogoPage } from '../pages/CatalogoPage';
import { CarritoPage } from '../pages/CarritoPage';
import { ReservasPage } from '../pages/ReservasPage';
import { LoginPage } from '../pages/LoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/catalogo" element={<CatalogoPage />} />
      <Route path="/carrito" element={<CarritoPage />} />
      <Route path="/reservas" element={<ReservasPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
