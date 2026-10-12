import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const alumnoSeleccionado = alumnos.find((a) => a.id === alumnoSelId);
  const saldoInsuficiente = alumnoSeleccionado ? alumnoSeleccionado.saldoDisponible < total : true;

  const handleCheckout = () => {
    setLoading(true);
    setFeedback(null);
    const res = confirmarReserva(alumnoSelId);
    setLoading(false);

    if (res.success) {
      setFeedback({ type: 'success', msg: res.message });
      setTimeout(() => {
        navigate('/reservas');
      }, 1500);
    } else {
      setFeedback({ type: 'error', msg: res.message });
    }
  };

  if (items.length === 0 && !feedback) {
    return (
      <div className="container py-5 text-center" data-testid="empty-cart-view">
        <div className="card shadow-sm border-0 p-5 mx-auto" style={{ maxWidth: '480px' }}>
          <div className="fs-1 text-muted mb-3">🛒</div>
          <h2 className="h4 fw-bold text-dark mb-2">Tu carrito está vacío</h2>
          <p className="text-muted small mb-4">
            Aún no has agregado materiales escolares para reservar.
          </p>
          <Link to="/catalogo" className="btn btn-primary">
            Explorar Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h3 fw-bold text-dark mb-4">Carrito de Reserva</h1>

      {feedback && (
        <div
          className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'} shadow-sm`}
          data-testid="cart-feedback"
        >
          {feedback.msg}
        </div>
      )}

      <div className="row g-4">
        {/* Tabla de artículos */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table align-middle mb-0" data-testid="cart-table">
                <thead className="table-light">
                  <tr>
                    <th>Material</th>
                    <th className="text-center" style={{ width: '150px' }}>
                      Cantidad
                    </th>
                    <th className="text-end">Precio Unit.</th>
                    <th className="text-end">Subtotal</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.producto.id} data-testid={`cart-row-${i.producto.id}`}>
                      <td>
                        <strong className="d-block text-dark">{i.producto.nombre}</strong>
                        <small className="text-muted font-monospace">{i.producto.sku}</small>
                      </td>
                      <td>
                        <div className="input-group input-group-sm justify-content-center">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => actualizarCantidad(i.producto.id, i.cantidad - 1)}
                            data-testid={`dec-btn-${i.producto.id}`}
                          >
                            −
                          </button>
                          <span
                            className="input-group-text bg-white px-3 fw-bold"
                            data-testid={`qty-${i.producto.id}`}
                          >
                            {i.cantidad}
                          </span>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => actualizarCantidad(i.producto.id, i.cantidad + 1)}
                            data-testid={`inc-btn-${i.producto.id}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="text-end text-muted">${i.producto.precioVenta.toLocaleString('es-CL')}</td>
                      <td className="text-end fw-bold text-dark" data-testid={`subtotal-${i.producto.id}`}>
                        ${i.subtotal.toLocaleString('es-CL')}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm text-danger border-0"
                          onClick={() => eliminarProducto(i.producto.id)}
                          title="Eliminar"
                          data-testid={`remove-btn-${i.producto.id}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-footer bg-white d-flex justify-content-between p-3 border-top">
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={vaciarCarrito}
                data-testid="clear-cart-btn"
              >
                Vaciar Carrito
              </button>
              <Link to="/catalogo" className="btn btn-sm btn-outline-primary">
                + Agregar más materiales
              </Link>
            </div>
          </div>
        </div>

        {/* Resumen y Checkout */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-4 bg-white" data-testid="checkout-card">
            <h2 className="fs-5 fw-bold text-dark mb-3">Resumen de Reserva</h2>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-dark">
                Selecciona Alumno Beneficiario:
              </label>
              <select
                className="form-select"
                value={alumnoSelId}
                onChange={(e) => setAlumnoSelId(Number(e.target.value))}
                data-testid="student-select"
              >
                {alumnos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} ({a.curso}) · Disp: ${a.saldoDisponible.toLocaleString('es-CL')}
                  </option>
                ))}
              </select>
            </div>

            {alumnoSeleccionado && (
              <div className="p-3 bg-light rounded-3 mb-3 small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Saldo Disponible:</span>
                  <strong className={saldoInsuficiente ? 'text-danger' : 'text-success'}>
                    ${alumnoSeleccionado.saldoDisponible.toLocaleString('es-CL')}
                  </strong>
                </div>
                {saldoInsuficiente && (
                  <div className="text-danger small mt-1">
                    ⚠ Saldo insuficiente para confirmar esta reserva.
                  </div>
                )}
              </div>
            )}

            <ul className="list-unstyled border-top pt-3 mb-3">
              <li className="d-flex justify-content-between mb-1 small text-muted">
                <span>Neto estimado:</span>
                <span>${subtotalNeto.toLocaleString('es-CL')}</span>
              </li>
              <li className="d-flex justify-content-between mb-1 small text-muted">
                <span>IVA (19%):</span>
                <span>${iva.toLocaleString('es-CL')}</span>
              </li>
              <li className="d-flex justify-content-between fs-5 fw-bold text-dark pt-2 border-top">
                <span>Total a comprometer:</span>
                <span className="text-primary" data-testid="cart-total-price">
                  ${total.toLocaleString('es-CL')}
                </span>
              </li>
            </ul>

            <button
              className="btn btn-success w-100 py-2 fw-bold"
              disabled={loading || saldoInsuficiente || items.length === 0}
              onClick={handleCheckout}
              data-testid="confirm-reservation-btn"
            >
              {loading ? 'Confirmando...' : 'Confirmar Reserva'}
            </button>
            <small className="text-muted text-center d-block mt-2" style={{ fontSize: '0.75rem' }}>
              El monto se comprometerá del saldo del alumno y no se debitará definitivamente hasta retirar en librería.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};
