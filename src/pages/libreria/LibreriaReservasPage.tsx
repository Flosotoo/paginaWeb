import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

export const LibreriaReservasPage: React.FC = () => {
  const { reservas, avanzarEstadoReserva } = useCart();
  const [view, setView] = useState<'menu' | 'preparar' | 'entregar' | 'entregadas'>('menu');

  const porPreparar = reservas.filter((r) =>
    ['PENDIENTE', 'EN_PREPARACION', 'ETIQUETA_PENDIENTE'].includes(r.estado)
  );

  const pendientesEntrega = reservas.filter((r) => r.estado === 'LISTA_PARA_RETIRO');

  const entregadas = reservas.filter((r) => r.estado === 'ENTREGADA');

  return (
    <>
      <Navbar />
      <main className="dashboard staff-dashboard">
        <Link to="/libreria" className="back-link">
          ← Inicio del encargado
        </Link>

        <section className="staff-panel">
          <span className="eyebrow">ÁREA DEL ENCARGADO</span>
          <h1>Reservas de Materiales</h1>
          <p>Selecciona la tarea que necesitas realizar.</p>

          {view === 'menu' && (
            <div className="staff-grid staff-reserve-paths">
              <button type="button" className="staff-tile" onClick={() => setView('preparar')}>
                <span className="staff-symbol">▤</span>
                <h2>Reservas por preparar ({porPreparar.length})</h2>
                <p>Escanear artículos, completar bolsa y generar etiqueta.</p>
                <b>Abrir →</b>
              </button>

              <button type="button" className="staff-tile peach" onClick={() => setView('entregar')}>
                <span className="staff-symbol">▣</span>
                <h2>Reservas pendientes de entrega ({pendientesEntrega.length})</h2>
                <p>Escanear bolsa y credencial del alumno para entregar.</p>
                <b>Abrir →</b>
              </button>

              <button type="button" className="staff-tile sage" onClick={() => setView('entregadas')}>
                <span className="staff-symbol">✓</span>
                <h2>Reservas entregadas ({entregadas.length})</h2>
                <p>Consultar historial de retiros y detalle de materiales entregados.</p>
                <b>Abrir →</b>
              </button>
            </div>
          )}

          {view !== 'menu' && (
            <div id="reserve-work" style={{ marginTop: '20px' }}>
              <button type="button" className="staff-small" onClick={() => setView('menu')} style={{ marginBottom: '15px' }}>
                ← Volver a opciones
              </button>

              <h2>
                {view === 'preparar' && 'Reservas por preparar'}
                {view === 'entregar' && 'Reservas pendientes de entrega'}
                {view === 'entregadas' && 'Historial de reservas entregadas'}
              </h2>

              {((view === 'preparar' && porPreparar.length === 0) ||
                (view === 'entregar' && pendientesEntrega.length === 0) ||
                (view === 'entregadas' && entregadas.length === 0)) && (
                <p className="muted" style={{ padding: '20px 0' }}>
                  No hay pedidos en esta categoría actualmente.
                </p>
              )}

              <div className="staff-history-scroll">
                <table className="staff-history-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Alumno</th>
                      <th>Artículos</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th>Estado</th>
                      <th>Etiqueta Bolsa</th>
                      <th style={{ textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(view === 'preparar' ? porPreparar : view === 'entregar' ? pendientesEntrega : entregadas).map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.codigo}</strong></td>
                        <td><strong>{r.nombreAlumno}</strong></td>
                        <td>
                          <small>
                            {r.items.map((i) => `${i.name} (${i.qty})`).join(', ')}
                          </small>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>${r.total.toLocaleString('es-CL')}</td>
                        <td><span className="staff-badge">{r.estado}</span></td>
                        <td>{r.codigoBolsa ? <code>{r.codigoBolsa}</code> : '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {r.estado === 'PENDIENTE' && (
                            <button
                              type="button"
                              className="staff-history-toggle"
                              onClick={() => avanzarEstadoReserva(r.id, 'EN_PREPARACION')}
                            >
                              ▶ Iniciar
                            </button>
                          )}
                          {r.estado === 'EN_PREPARACION' && (
                            <button
                              type="button"
                              className="staff-history-toggle"
                              style={{ background: '#fef3c7', color: '#b45309' }}
                              onClick={() => avanzarEstadoReserva(r.id, 'ETIQUETA_PENDIENTE')}
                            >
                              🏷 Rotular
                            </button>
                          )}
                          {r.estado === 'ETIQUETA_PENDIENTE' && (
                            <button
                              type="button"
                              className="staff-history-toggle"
                              style={{ background: '#dbeafe', color: '#1e40af' }}
                              onClick={() => avanzarEstadoReserva(r.id, 'LISTA_PARA_RETIRO')}
                            >
                              ✓ Lista
                            </button>
                          )}
                          {r.estado === 'LISTA_PARA_RETIRO' && (
                            <button
                              type="button"
                              className="btn secondary"
                              style={{ fontSize: '12px', padding: '4px 10px' }}
                              onClick={() => avanzarEstadoReserva(r.id, 'ENTREGADA')}
                            >
                              📦 Entregar
                            </button>
                          )}
                          {r.estado === 'ENTREGADA' && <span className="muted small">✓ Retirada</span>}
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
