import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';

export const NotFoundPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="dashboard" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="card" style={{ maxWidth: '450px', margin: '0 auto', padding: '40px 20px' }}>
          <span className="eyebrow" style={{ color: '#b91c1c' }}>ERROR 404</span>
          <h1 style={{ fontSize: '32px', margin: '10px 0' }}>Página no encontrada</h1>
          <p className="muted" style={{ margin: '0 0 25px' }}>
            La ruta solicitada no existe o fue movida en la plataforma EduSaldo.
          </p>
          <Link to="/" className="btn btn-wide" style={{ margin: '0 auto' }}>
            Volver a Mis Alumnos
          </Link>
        </div>
      </main>
    </>
  );
};
