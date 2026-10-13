import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';
import { Alumno, Producto } from '../../types';

export const LibreriaEntregaDirectaPage: React.FC = () => {
  const { alumnos, productos } = useCart();
  const [rut, setRut] = useState('');
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Array<{ producto: Producto; cant: number }>>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleBuscar = () => {
    setError('');
    setFeedback(null);
    const cleanRut = rut.trim();
    const found = alumnos.find((a) => a.rut === cleanRut);
    if (!found) {
      setError('No se encontró un alumno con ese RUT.');
      setAlumno(null);
      return;
    }
    if (found.edad < 12) {
      setError(`El alumno tiene ${found.edad} años. La entrega directa presencial solo está permitida para alumnos de 12 años o más (HU34).`);
      setAlumno(null);
      return;
    }
    setAlumno(found);
  };

  const handleAgregarProducto = (p: Producto) => {
    const existing = cart.find((i) => i.producto.id === p.id);
    if (existing) {
      setCart(cart.map((i) => (i.producto.id === p.id ? { ...i, cant: i.cant + 1 } : i)));
    } else {
      setCart([...cart, { producto: p, cant: 1 }]);
    }
  };

  const total = cart.reduce((acc, i) => acc + (i.cant * i.producto.precioVenta), 0);

  const handleConfirmar = () => {
    if (!alumno) return;
    if (alumno.saldoDisponible < total) {
      setError('Saldo disponible insuficiente para completar la entrega directa.');
      return;
    }
    setFeedback(`✓ Entrega directa confirmada para ${alumno.nombre}. Total debitado: $${total.toLocaleString('es-CL')}`);
    setCart([]);
  };

  return (
    <>
      <Navbar />
      <main className="dashboard staff-dashboard">
        <Link to="/libreria" className="back-link">
          ← Inicio del encargado
        </Link>

        <section className="staff-panel">
          <span className="eyebrow">ENTREGA PRESENCIAL · ALUMNOS DE 12 AÑOS O MÁS</span>
          <h1>Entrega directa de materiales</h1>
          <p>
            Identifica al alumno por RUT, agrega los materiales y confirma la entrega con cargo a su saldo disponible.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginTop: '20px' }}>
            <div>
              {/* Paso 1: Identificar Alumno */}
              <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                <h2>1. Identificar al alumno</h2>
                <p className="staff-note">
                  Solicita su credencial del colegio y verifica su edad (≥ 12 años). Ejemplo demo: Tomás Pérez (23.456.789-6).
                </p>

                <div className="staff-scan" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej: 23.456.789-6"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                  />
                  <button type="button" className="btn" onClick={handleBuscar}>
                    Buscar alumno
                  </button>
                </div>

                {error && <p className="form-feedback feedback-error" style={{ marginTop: '10px' }}>{error}</p>}
                {feedback && <p className="form-feedback physical-success" style={{ marginTop: '10px' }}>{feedback}</p>}

                {alumno && (
                  <div style={{ marginTop: '15px', padding: '15px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong style={{ fontSize: '18px' }}>{alumno.nombre}</strong>
                        <p style={{ margin: '3px 0 0', color: '#52695a', fontSize: '13px' }}>
                          Curso: {alumno.curso} · Edad: {alumno.edad} años · RUT {alumno.rut}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', display: 'block', color: '#15803d' }}>Saldo disponible:</span>
                        <strong style={{ fontSize: '20px', color: '#15803d' }}>
                          ${alumno.saldoDisponible.toLocaleString('es-CL')}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Paso 2: Seleccionar Materiales */}
              {alumno && (
                <div className="card" style={{ padding: '20px' }}>
                  <h2>2. Seleccionar materiales para entrega</h2>
                  <div className="staff-history-scroll" style={{ maxHeight: '350px' }}>
                    <table className="staff-history-table">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Precio</th>
                          <th>Disp.</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productos.map((p) => (
                          <tr key={p.id}>
                            <td><strong>{p.nombre}</strong> <small className="muted">({p.sku})</small></td>
                            <td>${p.precioVenta.toLocaleString('es-CL')}</td>
                            <td>{p.stockFisico - p.stockReservado}</td>
                            <td>
                              <button
                                type="button"
                                className="staff-history-toggle"
                                onClick={() => handleAgregarProducto(p)}
                              >
                                + Agregar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Carrito de entrega */}
            {alumno && (
              <div className="card" style={{ padding: '20px', height: 'fit-content' }}>
                <span className="eyebrow">RESUMEN DE ENTREGA</span>
                <h3 style={{ margin: '5px 0 15px' }}>Materiales a entregar</h3>

                {cart.length === 0 ? (
                  <p className="muted">Aún no has agregado materiales para esta entrega.</p>
                ) : (
                  <div>
                    {cart.map((i) => (
                      <div key={i.producto.id} className="cart-line">
                        <div>
                          <strong>{i.producto.nombre}</strong>
                          <small>{i.cant} × ${i.producto.precioVenta.toLocaleString('es-CL')}</small>
                        </div>
                        <strong>${(i.cant * i.producto.precioVenta).toLocaleString('es-CL')}</strong>
                        <button
                          type="button"
                          onClick={() => setCart(cart.filter((c) => c.producto.id !== i.producto.id))}
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    <div className="reserva-amount" style={{ marginTop: '15px' }}>
                      <span>Total compra directa</span>
                      <strong style={{ fontSize: '18px', color: '#173b31' }}>${total.toLocaleString('es-CL')}</strong>
                    </div>

                    <button
                      type="button"
                      className="btn btn-wide aporte-primary"
                      style={{ marginTop: '15px' }}
                      disabled={cart.length === 0 || alumno.saldoDisponible < total}
                      onClick={handleConfirmar}
                    >
                      Confirmar Entrega Directa
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};
