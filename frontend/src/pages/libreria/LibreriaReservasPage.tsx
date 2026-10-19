import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';
import { generateBarcodeSvg } from '../../utils/barcode';
import { Reserva } from '../../types';

export const LibreriaReservasPage: React.FC = () => {
  const {
    reservas,
    productos,
    alumnos,
    cancelarReserva,
    escanearArticuloReserva,
    generarEtiquetaReserva,
    marcarListaRetiro,
    entregarReservaConValidacion,
  } = useCart();

  const [view, setView] = useState<'menu' | 'preparar' | 'entregar' | 'entregadas'>('menu');
  const [selectedReservaId, setSelectedReservaId] = useState<string | null>(null);

  // Estados de escáner en preparación
  const [barcodeInput, setBarcodeInput] = useState('');
  const [prepFeedback, setPrepFeedback] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  // Estados de escáner en entrega
  const [bagInput, setBagInput] = useState('');
  const [studentInput, setStudentInput] = useState('');
  const [deliveryFeedback, setDeliveryFeedback] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const porPreparar = reservas.filter((r) =>
    ['PENDIENTE', 'EN_PREPARACION', 'ETIQUETA_PENDIENTE'].includes(r.estado)
  );

  const pendientesEntrega = reservas.filter((r) => r.estado === 'LISTA_PARA_RETIRO');
  const entregadas = reservas.filter((r) => r.estado === 'ENTREGADA');

  const activeReserva = reservas.find((r) => r.id === selectedReservaId);

  // Handler de pistoleo de artículo
  const handlePistolear = (code: string) => {
    if (!selectedReservaId || !code.trim()) return;
    setPrepFeedback(null);
    const res = escanearArticuloReserva(selectedReservaId, code);
    if (res.success) {
      setPrepFeedback({ tipo: 'ok', msg: res.message });
      setBarcodeInput('');
    } else {
      setPrepFeedback({ tipo: 'err', msg: res.message });
    }
  };

  // Handler de entrega con validación de bolsa y credencial
  const handleEntregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservaId) return;
    setDeliveryFeedback(null);
    const res = entregarReservaConValidacion(selectedReservaId, bagInput, studentInput);
    if (res.success) {
      setDeliveryFeedback({ tipo: 'ok', msg: res.message });
      setBagInput('');
      setStudentInput('');
    } else {
      setDeliveryFeedback({ tipo: 'err', msg: res.message });
    }
  };

  const getProductBarcode = (prodId: number) => {
    return productos.find((p) => p.id === prodId)?.codigoBarras || '7800000000000';
  };

  const isReservaCompleta = (r: Reserva) => {
    const sc = r.scanned || {};
    return r.items.length > 0 && r.items.every((it) => (sc[it.id] || 0) >= it.qty);
  };

  return (
    <>
      <Navbar />
      <main className="dashboard staff-dashboard">
        <Link to="/libreria" className="back-link">
          ← Inicio del encargado
        </Link>

        <section className="staff-panel">
          <span className="eyebrow">ÁREA DEL ENCARGADO</span>
          <h1>Preparación y Entrega de Reservas</h1>
          <p>
            Pistolea artículos para armar bolsas, genera etiquetas con código de barras y valida la entrega con credencial.
          </p>

          {view === 'menu' && (
            <div className="staff-grid staff-reserve-paths">
              <button
                type="button"
                className="staff-tile"
                onClick={() => {
                  setView('preparar');
                  setSelectedReservaId(null);
                }}
              >
                <span className="staff-symbol">▤</span>
                <h2>Reservas por preparar ({porPreparar.length})</h2>
                <p>Escanear artículos, completar bolsa y generar etiqueta.</p>
                <b>Abrir →</b>
              </button>

              <button
                type="button"
                className="staff-tile peach"
                onClick={() => {
                  setView('entregar');
                  setSelectedReservaId(null);
                }}
              >
                <span className="staff-symbol">▣</span>
                <h2>Reservas pendientes de entrega ({pendientesEntrega.length})</h2>
                <p>Escanear bolsa y credencial del alumno para entregar.</p>
                <b>Abrir →</b>
              </button>

              <button
                type="button"
                className="staff-tile sage"
                onClick={() => {
                  setView('entregadas');
                  setSelectedReservaId(null);
                }}
              >
                <span className="staff-symbol">✓</span>
                <h2>Reservas entregadas ({entregadas.length})</h2>
                <p>Consultar historial de retiros y detalle de materiales entregados.</p>
                <b>Abrir →</b>
              </button>
            </div>
          )}

          {view !== 'menu' && (
            <div id="reserve-work" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="staff-small"
                onClick={() => {
                  setView('menu');
                  setSelectedReservaId(null);
                  setPrepFeedback(null);
                  setDeliveryFeedback(null);
                }}
                style={{ marginBottom: '15px' }}
              >
                ← Volver a opciones
              </button>

              <h2>
                {view === 'preparar' && 'Reservas por preparar (Pistoleo y Armado de Bolsa)'}
                {view === 'entregar' && 'Reservas pendientes de entrega (Pistoleo de Bolsa y Credencial)'}
                {view === 'entregadas' && 'Historial de reservas entregadas'}
              </h2>

              {/* VISTA 1: PREPARACIÓN CON PISTOLEO REAL */}
              {view === 'preparar' && (
                <div style={{ marginTop: '15px' }}>
                  {porPreparar.length === 0 ? (
                    <p className="muted">No hay pedidos pendientes de preparación.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: selectedReservaId ? '1fr 1.1fr' : '1fr', gap: '20px' }}>
                      {/* Lista de órdenes */}
                      <div className="card" style={{ padding: '20px' }}>
                        <span className="eyebrow">PEDIDOS PENDIENTES</span>
                        <h3 style={{ margin: '5px 0 15px' }}>Selecciona una orden para preparar:</h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {porPreparar.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              className={`child-choice ${selectedReservaId === r.id ? 'is-selected' : ''}`}
                              onClick={() => {
                                setSelectedReservaId(r.id);
                                setPrepFeedback(null);
                              }}
                              style={{ width: '100%', textAlign: 'left' }}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>{r.codigo}</strong>
                                <span className="staff-badge">{r.estado}</span>
                              </div>
                              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                Alumno: <strong>{r.nombreAlumno}</strong> · Total: ${r.total.toLocaleString('es-CL')}
                              </p>
                              <small className="muted">{r.items.length} materiales en el pedido</small>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mesa de Trabajo de Pistoleo */}
                      {activeReserva && (
                        <div className="card" style={{ padding: '20px', background: '#fffaf2' }}>
                          <span className="eyebrow">ESTACIÓN DE EMPAQUE</span>
                          <h3 style={{ margin: '5px 0 10px' }}>Preparando Pedido {activeReserva.codigo}</h3>
                          <p className="muted small" style={{ margin: '0 0 15px' }}>
                            Alumno: <strong>{activeReserva.nombreAlumno}</strong>
                          </p>

                          {prepFeedback && (
                            <p
                              className={`form-feedback ${prepFeedback.tipo === 'ok' ? 'physical-success' : 'feedback-error'}`}
                              style={{ marginBottom: '15px' }}
                            >
                              {prepFeedback.msg}
                            </p>
                          )}

                          <h4>Progreso del armado de la bolsa:</h4>
                          <div style={{ margin: '15px 0' }}>
                            {activeReserva.items.map((it) => {
                              const barcode = getProductBarcode(it.id);
                              const count = (activeReserva.scanned || {})[it.id] || 0;
                              const complete = count >= it.qty;
                              return (
                                <div key={it.id} className="staff-line" style={{ padding: '8px 0', borderBottom: '1px solid #d5e1d1' }}>
                                  <div>
                                    <span style={{ fontWeight: 700 }}>{it.name}</span>
                                    <br />
                                    <button
                                      type="button"
                                      onClick={() => handlePistolear(barcode)}
                                      title="Simular escaneo de código de barra"
                                      style={{
                                        fontSize: '11px',
                                        background: '#e2eee5',
                                        border: '1px solid #abc8ac',
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                        cursor: 'pointer',
                                        color: '#173b31',
                                      }}
                                    >
                                      📷 Pistolear: {barcode}
                                    </button>
                                  </div>
                                  <strong style={{ color: complete ? '#15803d' : '#b45309', fontSize: '16px' }}>
                                    {count} / {it.qty} {complete && '✓'}
                                  </strong>
                                </div>
                              );
                            })}
                          </div>

                          {/* Input para escanear/pistolear manualmente */}
                          {!isReservaCompleta(activeReserva) && (
                            <div style={{ marginTop: '15px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                                Pistolea el artículo o ingresa el código de barra:
                              </label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="text"
                                  className="input"
                                  placeholder="Ej: 7800000000101"
                                  value={barcodeInput}
                                  onChange={(e) => setBarcodeInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handlePistolear(barcodeInput);
                                    }
                                  }}
                                />
                                <button type="button" className="btn" onClick={() => handlePistolear(barcodeInput)}>
                                  Escanear
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Paso siguiente: bolsa completa y rótulo */}
                          {isReservaCompleta(activeReserva) && (
                            <div style={{ marginTop: '20px', padding: '15px', background: '#dcfce7', borderRadius: '12px', border: '1px solid #86efac' }}>
                              <strong style={{ color: '#15803d', display: 'block', marginBottom: '8px' }}>
                                ✓ ¡Todos los artículos han sido pistoleados y están en la bolsa!
                              </strong>

                              {!activeReserva.codigoBolsa ? (
                                <button
                                  type="button"
                                  className="btn btn-wide aporte-primary"
                                  onClick={() => generarEtiquetaReserva(activeReserva.id)}
                                >
                                  🏷 Generar Rótulo y Código de Bolsa
                                </button>
                              ) : (
                                <div>
                                  <div
                                    style={{
                                      background: 'white',
                                      padding: '15px',
                                      borderRadius: '8px',
                                      textAlign: 'center',
                                      border: '2px dashed #173b31',
                                      margin: '12px 0',
                                    }}
                                  >
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', display: 'block' }}>
                                      ETIQUETA DE BOLSA GENERADA
                                    </span>
                                    <h3 style={{ margin: '5px 0' }}>{activeReserva.nombreAlumno}</h3>
                                    <p style={{ margin: '0 0 10px', fontSize: '13px' }}>Reserva {activeReserva.codigo}</p>
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: generateBarcodeSvg(activeReserva.codigoBolsa),
                                      }}
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    className="btn btn-wide aporte-primary"
                                    onClick={() => {
                                      marcarListaRetiro(activeReserva.id);
                                      setSelectedReservaId(null);
                                    }}
                                  >
                                    ✓ Marcar Bolsa Rotulada Lista para Retiro
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="link-like"
                              style={{ color: '#b91c1c', fontSize: '12px', background: 'none', border: 0, cursor: 'pointer' }}
                              onClick={() => {
                                if (confirm('¿Confirmas cancelar esta reserva?')) {
                                  cancelarReserva(activeReserva.id, 'Cancelada por encargado');
                                  setSelectedReservaId(null);
                                }
                              }}
                            >
                              Cancelar reserva
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 2: ENTREGA CON VALIDACIÓN DE BOLSA Y CREDENCIAL */}
              {view === 'entregar' && (
                <div style={{ marginTop: '15px' }}>
                  {pendientesEntrega.length === 0 ? (
                    <p className="muted">No hay pedidos pendientes de entrega en mesón.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: selectedReservaId ? '1fr 1.1fr' : '1fr', gap: '20px' }}>
                      <div className="card" style={{ padding: '20px' }}>
                        <span className="eyebrow">LISTAS PARA RETIRO</span>
                        <h3 style={{ margin: '5px 0 15px' }}>Bolsas en estante de entrega:</h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {pendientesEntrega.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              className={`child-choice ${selectedReservaId === r.id ? 'is-selected' : ''}`}
                              onClick={() => {
                                setSelectedReservaId(r.id);
                                setDeliveryFeedback(null);
                                setBagInput(r.codigoBolsa || '');
                                const al = alumnos.find((a) => a.id === r.alumnoId);
                                setStudentInput(al?.rut || '');
                              }}
                              style={{ width: '100%', textAlign: 'left' }}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>{r.codigo}</strong>
                                <span className="staff-badge staff-stock-ok">Bolsa: {r.codigoBolsa}</span>
                              </div>
                              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                Alumno: <strong>{r.nombreAlumno}</strong> · Total: ${r.total.toLocaleString('es-CL')}
                              </p>
                              <small className="muted">Haz clic para cargar en el lector de entrega</small>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Formulario de entrega */}
                      {activeReserva && (
                        <div className="card" style={{ padding: '20px', background: '#fffaf2' }}>
                          <span className="eyebrow">VALIDACIÓN DE ENTREGA</span>
                          <h3 style={{ margin: '5px 0 10px' }}>Entregar Reserva {activeReserva.codigo}</h3>
                          <p className="muted small" style={{ margin: '0 0 15px' }}>
                            Alumno: <strong>{activeReserva.nombreAlumno}</strong> · Bolsa asignada:{' '}
                            <code>{activeReserva.codigoBolsa}</code>
                          </p>

                          {deliveryFeedback && (
                            <p
                              className={`form-feedback ${deliveryFeedback.tipo === 'ok' ? 'physical-success' : 'feedback-error'}`}
                              style={{ marginBottom: '15px' }}
                            >
                              {deliveryFeedback.msg}
                            </p>
                          )}

                          <form onSubmit={handleEntregar}>
                            <div className="field" style={{ marginBottom: '12px' }}>
                              <label htmlFor="bag-scan">Pistolear código de la bolsa física:</label>
                              <input
                                id="bag-scan"
                                className="input"
                                type="text"
                                placeholder="Ej: BOL-1234"
                                value={bagInput}
                                onChange={(e) => setBagInput(e.target.value)}
                                required
                              />
                            </div>

                            <div className="field" style={{ marginBottom: '15px' }}>
                              <label htmlFor="student-scan">Pistolear credencial o RUT del alumno:</label>
                              <input
                                id="student-scan"
                                className="input"
                                type="text"
                                placeholder="Ej: 12.345.678-5 o ALU-1"
                                value={studentInput}
                                onChange={(e) => setStudentInput(e.target.value)}
                                required
                              />
                            </div>

                            <button type="submit" className="btn btn-wide aporte-primary">
                              Validar Escáner y Registrar Entrega Definitiva
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 3: HISTORIAL DE ENTREGADAS */}
              {view === 'entregadas' && (
                <div className="card" style={{ padding: '20px', marginTop: '15px' }}>
                  {entregadas.length === 0 ? (
                    <p className="muted">No hay pedidos entregados aún.</p>
                  ) : (
                    <div className="staff-history-scroll">
                      <table className="staff-history-table">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Alumno</th>
                            <th>Total</th>
                            <th>Bolsa Entregada</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entregadas.map((r) => (
                            <tr key={r.id}>
                              <td><strong>{r.codigo}</strong></td>
                              <td>{r.nombreAlumno}</td>
                              <td>${r.total.toLocaleString('es-CL')}</td>
                              <td><code>{r.codigoBolsa}</code></td>
                              <td><span className="staff-badge staff-stock-ok">✓ Entregada</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
};
