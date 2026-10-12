import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-white pt-4 pb-3 mt-auto border-top border-secondary">
      <div className="container">
        <div className="row gy-3">
          <div className="col-md-6 text-center text-md-start">
            <h5 className="fw-bold mb-1">EduSaldo 2.0 · Librería Escolar</h5>
            <p className="small text-muted mb-0">
              Centro General de Padres y Apoderados. Sistema integral de saldos, compras y reservas de útiles escolares.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <p className="small text-muted mb-1">
              Desarrollo Fullstack II (DSY1104) · Experiencia 2: SPA React + TypeScript
            </p>
            <p className="small text-muted mb-0">
              © {new Date().getFullYear()} EduSaldo. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
