import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="container py-5 text-center">
      <div className="py-5">
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h2 className="h4 fw-bold text-dark mb-3">Página no encontrada</h2>
        <p className="text-muted mb-4">
          La ruta solicitada no existe o fue movida en la plataforma EduSaldo.
        </p>
        <Link to="/" className="btn btn-primary px-4">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
};
