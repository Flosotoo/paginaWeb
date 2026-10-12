import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { EstadoReserva } from '../types';

export const ReservasPage: React.FC = () => {
  const { reservas, cancelarReserva } = useCart();

  const getBadgeClass = (estado: EstadoReserva) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-secondary';
      case 'EN_PREPARACION':
        return 'bg-info text-dark';
      case 'ETIQUETA_PENDIENTE':
        return 'bg-warning text-dark';
      case 'LISTA_PARA_RETIRO':
        return 'bg-primary';
      case 'ENTREGADA':
        return 'bg-success';
      case 'CANCELADA':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const getEstadoTexto = (estado: EstadoReserva) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente de preparación';
      case 'EN_PREPARACION':
        return 'En preparación en librería';
      case 'ETIQUETA_PENDIENTE':
        return 'Etiqueta de bolsa generada';
      case 'LISTA_PARA_RETIRO':
        return 'Lista para retiro';
      case 'ENTREGADA':
        return 'Entregada en librería';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Mis Reservas de Materiales</h1>
          <p className="text-muted small mb-0">
            Sigue el estado de preparación y retiro de tus pedidos de útiles escolares.
          </p>
        </div>
        <Link to="/catalogo" className="btn btn-outline-primary btn-sm">
          + Nueva Reserva
        </Link>
      </div>

      {reservas.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center">
          <p className="text-muted fs-5 mb-3">No registras reservas activas ni históricas.</p>
          <div>
            <Link to="/catalogo" className="btn btn-primary">
              Ir al Catálogo
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4" data-testid="reservations-list">
          {reservas.map((r) => (
            <div key={r.id} className="col-12" data-testid={`reservation-card-${r.id}`}>
              <div className="card shadow-sm border-0 p-3 bg-white">
                <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-2 mb-3">
                  <div>
                    <span className={`badge ${getBadgeClass(r.estado)} me-2`}>
                      {getEstadoTexto(r.estado)}
                    </span>
                    <strong className="text-dark fs-5">{r.codigo}</strong>
                    {r.codigoBolsa && (
                      <span className="badge bg-light text-dark border ms-2 font-monospace">
                        🏷 Bolsa: {r.codigoBolsa}
                      </span>
                    )}
                  </div>
                  <div className="text-end">
                    <span className="fs-5 fw-bold text-primary">
                      ${r.total.toLocaleString('es-CL')}
                    </span>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                      {new Date(r.fechaCreacion).toLocaleDateString('es-CL')}
                    </small>
                  </div>
                </div>

                <div className="row align-items-center">
                  <div className="col-md-8">
                    <p className="small mb-1 text-muted">
                      Alumno beneficiario: <strong className="text-dark">{r.nombreAlumno}</strong>
                    </p>
                    <ul className="list-inline mb-0 small text-secondary">
                      {r.items.map((it, idx) => (
                        <li key={idx} className="list-inline-item">
                          • {it.name} <span className="text-muted">({it.qty} × ${it.price.toLocaleString('es-CL')})</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    {r.estado !== 'ENTREGADA' && r.estado !== 'CANCELADA' && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          if (confirm('¿Confirmas la cancelación de esta reserva? El saldo y stock serán liberados.')) {
                            cancelarReserva(r.id, 'Cancelada por el apoderado');
                          }
                        }}
                        data-testid={`cancel-reserva-${r.id}`}
                      >
                        Cancelar Reserva
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
