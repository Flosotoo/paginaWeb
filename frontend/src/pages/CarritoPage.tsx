import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';

export const CarritoPage: React.FC = () => {
  const {
    items,
    alumnos,
    total,
    subtotalNeto,
    iva,
    eliminarProducto,
    actualizarCantidad,
    vaciarCarrito,
    confirmarReserva,
  } = useCart();

  const [alumnoSelId, setAlumnoSelId] = useState<number>(alumnos[0]?.id || 1);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const navigate = useNavigate();

  const alumno = alumnos.find((a) => a.id === alumnoSelId);
  const saldoInsuficiente = alumno ? alumno.saldoDisponible < total : true;

  const handleCheckout = () => {
    const res = confirmarReserva(alumnoSelId);
    if (res.success) {
      setFeedback({ type: 'ok', msg: res.message });
      setTimeout(() => navigate('/reservas'), 1500);
    } else {
      setFeedback({ type: 'err', msg: res.message });
    }
  };

  return (
    <>
      <Navbar />
      <main className="dashboard detail-dashboard">
        <Link to="/catalogo" className="back-link">
          ← Volver al catálogo
        </Link>

        <section className="family-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MI CARRITO</span>
              <h2>Revisión de Materiales para Reserva</h2>
            </div>
          </div>

          {feedback && (
            <div
              className={`form-feedback ${feedback.type === 'ok' ? 'physical-success' : 'feedback-error'}`}
              style={{ marginBottom: '20px' }}
              data-testid="cart-feedback"
            >
              {feedback.msg}
            </div>
          )}

          {items.length === 0 ? (
            <div className="card text-center" style={{ padding: '40px 20px', textAlign: 'center' }} data-testid="empty-cart-view">
              <p className="muted" style={{ fontSize: '18px', margin: '0 0 20px' }}>
                Tu carrito de reserva está vacío.
              </p>
              <Link to="/catalogo" className="btn btn-wide" style={{ maxWidth: '250px', margin: '0 auto' }}>
                Ver Catálogo
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <div className="staff-history-scroll">
                  <table className="staff-history-table" data-testid="cart-table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th style={{ textAlign: 'center' }}>Cantidad</th>
                        <th style={{ textAlign: 'right' }}>Precio</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.producto.id} data-testid={`cart-row-${it.producto.id}`}>
                          <td>
                            <strong>{it.producto.nombre}</strong>
                            <br />
                            <small className="muted">{it.producto.sku}</small>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                className="staff-history-toggle"
                                onClick={() => actualizarCantidad(it.producto.id, it.cantidad - 1)}
                                data-testid={`dec-btn-${it.producto.id}`}
                              >
                                −
                              </button>
                              <strong data-testid={`qty-${it.producto.id}`}>{it.cantidad}</strong>
                              <button
                                type="button"
                                className="staff-history-toggle"
                                onClick={() => actualizarCantidad(it.producto.id, it.cantidad + 1)}
                                data-testid={`inc-btn-${it.producto.id}`}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>${it.producto.precioVenta.toLocaleString('es-CL')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }} data-testid={`subtotal-${it.producto.id}`}>
                            ${it.subtotal.toLocaleString('es-CL')}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="staff-history-toggle"
                              style={{ color: '#b91c1c' }}
                              onClick={() => eliminarProducto(it.producto.id)}
                              data-testid={`remove-btn-${it.producto.id}`}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" className="btn secondary" onClick={vaciarCarrito} data-testid="clear-cart-btn">
                    Vaciar Carrito
                  </button>
                  <Link to="/catalogo" className="btn secondary">
                    + Agregar más
                  </Link>
                </div>
              </div>

              {/* Panel de Checkout */}
              <div className="card" style={{ padding: '24px' }} data-testid="checkout-card">
                <span className="eyebrow">CONFIRMACIÓN</span>
                <h3 style={{ margin: '8px 0 16px', fontSize: '20px' }}>Resumen de Reserva</h3>

                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="student-cart-sel" style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '5px' }}>
                    Alumno beneficiario:
                  </label>
                  <select
                    id="student-cart-sel"
                    className="input"
                    value={alumnoSelId}
                    onChange={(e) => setAlumnoSelId(Number(e.target.value))}
                    data-testid="student-select"
                  >
                    {alumnos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} (Disp: ${a.saldoDisponible.toLocaleString('es-CL')})
                      </option>
                    ))}
                  </select>
                </div>

                {alumno && (
                  <div style={{ background: '#f5f7f4', padding: '12px', borderRadius: '10px', marginBottom: '15px', fontSize: '13px' }}>
                    <span>Saldo disponible: </span>
                    <strong style={{ color: saldoInsuficiente ? '#b91c1c' : '#173b31' }}>
                      ${alumno.saldoDisponible.toLocaleString('es-CL')}
                    </strong>
                    {saldoInsuficiente && (
                      <p style={{ color: '#b91c1c', margin: '5px 0 0', fontWeight: 700, fontSize: '12px' }}>
                        ⚠ Saldo insuficiente para esta reserva.
                      </p>
                    )}
                  </div>
                )}

                <div className="reserva-amount">
                  <span>Neto estimado</span>
                  <strong>${subtotalNeto.toLocaleString('es-CL')}</strong>
                </div>
                <div className="reserva-amount">
                  <span>IVA (19%)</span>
                  <strong>${iva.toLocaleString('es-CL')}</strong>
                </div>
                <div className="reserva-amount" style={{ fontSize: '16px', borderBottom: 'none' }}>
                  <span>Total reserva</span>
                  <strong style={{ color: '#173b31', fontSize: '20px' }} data-testid="cart-total-price">
                    ${total.toLocaleString('es-CL')}
                  </strong>
                </div>

                <button
                  type="button"
                  className="btn btn-wide aporte-primary"
                  style={{ marginTop: '20px' }}
                  disabled={items.length === 0 || saldoInsuficiente}
                  onClick={handleCheckout}
                  data-testid="confirm-reservation-btn"
                >
                  Confirmar Reserva
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
};
