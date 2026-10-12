import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const HomePage: React.FC = () => {
  const { alumnos } = useCart();

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-primary text-white py-5 mb-5 rounded-bottom shadow">
        <div className="container py-3">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <span className="badge bg-warning text-dark text-uppercase px-3 py-2 mb-3 fw-bold">
                Plataforma Oficial
              </span>
              <h1 className="display-4 fw-bold mb-3">Librería Escolar EduSaldo</h1>
              <p className="lead text-white-50 mb-4">
                Administra los saldos de tus alumnos, consulta compras y reserva materiales escolares
                sin filas de forma rápida, transparente y digital.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/catalogo" className="btn btn-warning btn-lg fw-bold text-dark px-4 shadow-sm">
                  🛍 Ver Catálogo y Reservar
                </Link>
                <Link to="/reservas" className="btn btn-outline-light btn-lg px-4">
                  Mis Reservas
                </Link>
              </div>
            </div>
            <div className="col-lg-5 text-center mt-4 mt-lg-0">
              <img
                src="/assets/img/landing-page.jpg"
                alt="Librería Escolar"
                className="img-fluid rounded-4 shadow-lg border border-3 border-white"
                style={{ maxHeight: '320px', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tarjetas de Alumnos Asociados */}
      <div className="container mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fs-4 fw-bold text-dark mb-0">Mis Alumnos Registrados</h2>
          <small className="text-muted">Cuentas vinculadas a tu perfil de apoderado</small>
        </div>

        <div className="row g-3">
          {alumnos.map((a) => (
            <div key={a.id} className="col-md-6" data-testid={`student-card-${a.id}`}>
              <div className="card shadow-sm border-0 h-100 p-3 bg-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="fs-5 fw-bold text-dark mb-1">{a.nombre}</h3>
                    <p className="text-muted small mb-2">
                      RUT: {a.rut} · Curso: <span className="fw-semibold text-dark">{a.curso}</span> ({a.edad} años)
                    </p>
                  </div>
                  <span className="badge bg-success-subtle text-success fs-6">
                    ${a.balance.toLocaleString('es-CL')}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                  <span className="small text-muted">
                    Disponible: <strong className="text-primary">${a.saldoDisponible.toLocaleString('es-CL')}</strong>
                    {a.saldoComprometido > 0 && (
                      <span className="text-warning ms-1">
                        (Retenido: ${a.saldoComprometido.toLocaleString('es-CL')})
                      </span>
                    )}
                  </span>
                  <Link to="/catalogo" className="btn btn-sm btn-outline-primary">
                    Reservar útiles
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
