import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { ProductList } from '../components/catalogo/ProductList';
import { useCart } from '../context/CartContext';

export const CatalogoPage: React.FC = () => {
  const { productos, items, alumnos, total, eliminarProducto, vaciarCarrito, confirmarReserva } = useCart();
  const [alumnoId, setAlumnoId] = useState<number>(alumnos[0]?.id || 1);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const navigate = useNavigate();

  const alumno = alumnos.find((a) => a.id === alumnoId) || alumnos[0];
  const saldoInsuficiente = alumno ? alumno.saldoDisponible < total : true;
  const saldoRestante = alumno ? Math.max(0, alumno.saldoDisponible - total) : 0;

  const handleConfirmar = () => {
    setMensaje(null);
    const res = confirmarReserva(alumnoId);
    if (res.success) {
      setMensaje({ tipo: 'ok', texto: res.message });
      setTimeout(() => navigate('/reservas'), 1500);
    } else {
      setMensaje({ tipo: 'err', texto: res.message });
    }
  };

  return (
    <>
      <Navbar />
      <main className="dashboard detail-dashboard">
        <Link to="/" className="back-link">
          ← Volver a la cuenta
        </Link>

        {alumno && (
          <section className="detail-hero detail-hero-compact aporte-student-strip">
            <span className="eyebrow">RESERVA PARA EL ALUMNO</span>
            <div className="detail-person">
              <span className="detail-avatar">{alumno.nombre.charAt(0)}</span>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px' }}>{alumno.nombre}</h1>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
                  {alumno.curso} · RUT {alumno.rut}
                </p>
              </div>
            </div>
            <div className="detail-balance">
              <span>Saldo disponible para reservar</span>
              <strong>${alumno.saldoDisponible.toLocaleString('es-CL')}</strong>
            </div>
          </section>
        )}

        <section className="reserva-panel">
          <span className="eyebrow">MATERIALES ESCOLARES</span>
          <h2>Elige sus materiales</h2>
          <p className="muted">
            Busca un material o selecciona una categoría. Indica la cantidad y agrégalo a tu reserva.
          </p>

          <div id="reserva-app">
            <div className="reserva-layout">
              <ProductList productos={productos} />

              <aside className="reserva-aside" data-testid="checkout-card">
                <h3>Mi reserva</h3>

                {mensaje && (
                  <div
                    className={`form-feedback ${mensaje.tipo === 'ok' ? 'physical-success' : 'feedback-error'}`}
                    style={{ marginBottom: '15px' }}
                    data-testid="cart-feedback"
                  >
                    {mensaje.texto}
                  </div>
                )}

                <div className="mb-3" style={{ marginBottom: '15px' }}>
                  <label htmlFor="alumno-sel" style={{ fontSize: '12px', fontWeight: 800, display: 'block', marginBottom: '5px' }}>
                    Alumno para esta reserva:
                  </label>
                  <select
                    id="alumno-sel"
                    className="input"
                    value={alumnoId}
                    onChange={(e) => setAlumnoId(Number(e.target.value))}
                    data-testid="student-select"
                  >
                    {alumnos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} (Disp: ${a.saldoDisponible.toLocaleString('es-CL')})
                      </option>
                    ))}
                  </select>
                </div>

                <div id="reserva-carrito" aria-live="polite">
                  {items.length === 0 ? (
                    <p className="muted" style={{ fontSize: '14px', margin: '15px 0' }}>
                      Aún no has agregado materiales a la reserva.
                    </p>
                  ) : (
                    <div>
                      {items.map((it) => (
                        <div key={it.producto.id} className="cart-line" data-testid={`cart-row-${it.producto.id}`}>
                          <div>
                            <strong>{it.producto.nombre}</strong>
                            <small>{it.cantidad} × ${it.producto.precioVenta.toLocaleString('es-CL')}</small>
                          </div>
                          <strong>${it.subtotal.toLocaleString('es-CL')}</strong>
                          <button
                            type="button"
                            onClick={() => eliminarProducto(it.producto.id)}
                            title="Eliminar"
                            data-testid={`remove-btn-${it.producto.id}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <div style={{ marginTop: '10px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="link-like"
                          onClick={vaciarCarrito}
                          style={{ fontSize: '12px', color: '#b91c1c', background: 'none', border: 0, cursor: 'pointer' }}
                          data-testid="clear-cart-btn"
                        >
                          Vaciar reserva
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="reserva-amount">
                  <span>Total de esta reserva</span>
                  <strong data-testid="cart-total-price">${total.toLocaleString('es-CL')}</strong>
                </div>

                <div className="reserva-amount">
                  <span>Saldo disponible actual</span>
                  <strong>${alumno ? alumno.saldoDisponible.toLocaleString('es-CL') : 0}</strong>
                </div>

                <div className="reserva-remaining">
                  <span style={{ fontSize: '11px', fontWeight: 800 }}>SALDO RESTANTE ESTIMADO</span>
                  <strong>${saldoRestante.toLocaleString('es-CL')}</strong>
                </div>

                {saldoInsuficiente && items.length > 0 && (
                  <p style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 700, margin: '10px 0 0' }}>
                    ⚠ Saldo insuficiente para confirmar esta reserva.
                  </p>
                )}

                <button
                  type="button"
                  className="btn btn-wide aporte-primary"
                  style={{ marginTop: '18px' }}
                  disabled={items.length === 0 || saldoInsuficiente}
                  onClick={handleConfirmar}
                  data-testid="confirm-reservation-btn"
                >
                  Confirmar reserva
                </button>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};
