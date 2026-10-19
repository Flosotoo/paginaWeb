import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import { EstadoReserva } from '../types';

export const ReservasPage: React.FC = () => {
  const { reservas, cancelarReserva } = useCart();

  const getEstadoBadge = (estado: EstadoReserva) => {
    switch (estado) {
      case 'PENDIENTE':
        return <span className="staff-badge staff-stock-warn">Pendiente</span>;
      case 'EN_PREPARACION':
        return <span className="staff-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>En preparación</span>;
      case 'ETIQUETA_PENDIENTE':
        return <span className="staff-badge" style={{ background: '#fef3c7', color: '#b45309' }}>Etiqueta generada</span>;
      case 'LISTA_PARA_RETIRO':
        return <span className="staff-badge staff-stock-ok">Lista para retiro</span>;
      case 'ENTREGADA':
        return <span className="staff-badge" style={{ background: '#dcfce7', color: '#15803d' }}>Entregada</span>;
      case 'CANCELADA':
        return <span className="staff-badge staff-stock-low">Cancelada</span>;
      default:
        return <span className="staff-badge">{estado}</span>;
    }
  };

  return (
    <>
      <Navbar />
      <main className="dashboard detail-dashboard">
        <Link to="/" className="back-link">
          ← Volver a la cuenta
        </Link>

        <section className="family-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SEGUIMIENTO DE PEDIDOS</span>
              <h2>Mis Reservas de Materiales</h2>
              <p className="muted">
                Consulta el estado de empaque y retiro de los útiles reservados para tus alumnos.
              </p>
            </div>
            <Link to="/catalogo" className="btn secondary">
              + Nueva Reserva
            </Link>
          </div>

          {reservas.length === 0 ? (
            <div className="card text-center" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p className="muted" style={{ fontSize: '18px', margin: '0 0 20px' }}>
                No registras pedidos ni reservas activas.
              </p>
              <Link to="/catalogo" className="btn btn-wide" style={{ maxWidth: '250px', margin: '0 auto' }}>
                Ir al Catálogo
              </Link>
            </div>
          ) : (
            <div className="card" style={{ padding: '20px' }} data-testid="reservations-list">
              <div className="staff-history-scroll">
                <table className="staff-history-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Fecha</th>
                      <th>Alumno</th>
                      <th>Detalle de Materiales</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th>Estado</th>
                      <th>Bolsa / Rótulo</th>
                      <th style={{ textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map((r) => (
                      <tr key={r.id} data-testid={`reservation-card-${r.id}`}>
                        <td>
                          <strong>{r.codigo}</strong>
                        </td>
                        <td>{new Date(r.fechaCreacion).toLocaleDateString('es-CL')}</td>
                        <td>
                          <strong>{r.nombreAlumno}</strong>
                        </td>
                        <td>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                            {r.items.map((it, idx) => (
                              <li key={idx}>
                                {it.name} ({it.qty} × ${it.price.toLocaleString('es-CL')})
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#173b31' }}>
                          ${r.total.toLocaleString('es-CL')}
                        </td>
                        <td>{getEstadoBadge(r.estado)}</td>
                        <td>
                          {r.codigoBolsa ? (
                            <code style={{ background: '#f5f7f4', padding: '3px 7px', borderRadius: '4px', fontWeight: 700 }}>
                              {r.codigoBolsa}
                            </code>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {r.estado !== 'ENTREGADA' && r.estado !== 'CANCELADA' && (
                            <button
                              type="button"
                              className="staff-history-toggle"
                              style={{ color: '#b91c1c' }}
                              onClick={() => {
                                if (confirm('¿Confirmas cancelar la reserva? El saldo y stock serán liberados.')) {
                                  cancelarReserva(r.id, 'Cancelada por apoderado');
                                }
                              }}
                              data-testid={`cancel-reserva-${r.id}`}
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
};
