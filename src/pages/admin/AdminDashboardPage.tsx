import React, { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

export const AdminDashboardPage: React.FC = () => {
  const { productos, alumnos, reservas, avanzarEstadoReserva } = useCart();
  const [tab, setTab] = useState<'inventario' | 'alumnos' | 'reservas'>('inventario');

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <span className="eyebrow">MÓDULO ADMINISTRATIVO</span>
        <h1>Control y Operaciones de Librería</h1>

        <section className="admin-welcome" style={{ marginBottom: '24px' }}>
          <div>
            <span className="eyebrow">CENTRO GENERAL DE PADRES</span>
            <h2>Gestión de la librería escolar</h2>
            <p>Supervisa el stock, la nómina de estudiantes y el empaque de reservas.</p>
          </div>
          <div className="admin-welcome-mark">
            e<span>·</span>
          </div>
        </section>

        {/* Selector de pestañas con botones al estilo EduSaldo */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            className={`btn ${tab === 'inventario' ? '' : 'secondary'}`}
            onClick={() => setTab('inventario')}
            data-testid="tab-inventario"
          >
            ▦ Inventario y Stock
          </button>
          <button
            type="button"
            className={`btn ${tab === 'alumnos' ? '' : 'secondary'}`}
            onClick={() => setTab('alumnos')}
            data-testid="tab-alumnos"
          >
            👥 Alumnos y Saldos
          </button>
          <button
            type="button"
            className={`btn ${tab === 'reservas' ? '' : 'secondary'}`}
            onClick={() => setTab('reservas')}
            data-testid="tab-reservas"
          >
            📦 Preparación en Librería ({reservas.filter((r) => r.estado !== 'ENTREGADA' && r.estado !== 'CANCELADA').length})
          </button>
        </div>

        {/* Tab Inventario */}
        {tab === 'inventario' && (
          <div className="card" style={{ padding: '20px' }} data-testid="panel-inventario">
            <div className="section-heading" style={{ marginBottom: '15px' }}>
              <div>
                <span className="eyebrow">BODEGA DE MATERIALES</span>
                <h2>Stock Físico, Reservado y Disponible</h2>
              </div>
            </div>

            <div className="staff-history-scroll">
              <table className="staff-history-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Material</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Precio</th>
                    <th style={{ textAlign: 'center' }}>Físico</th>
                    <th style={{ textAlign: 'center' }}>Reservado</th>
                    <th style={{ textAlign: 'center' }}>Disponible</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => {
                    const disp = p.stockFisico - p.stockReservado;
                    return (
                      <tr key={p.id}>
                        <td><code>{p.sku}</code></td>
                        <td><strong>{p.nombre}</strong></td>
                        <td><span className="small-tag">{p.categoria}</span></td>
                        <td style={{ textAlign: 'right' }}>${p.precioVenta.toLocaleString('es-CL')}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>{p.stockFisico}</td>
                        <td style={{ textAlign: 'center', color: '#b45309', fontWeight: 800 }}>{p.stockReservado}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#173b31' }}>{disp}</td>
                        <td>
                          {disp <= 0 ? (
                            <span className="staff-badge staff-stock-low">Agotado</span>
                          ) : disp <= p.stockCritico ? (
                            <span className="staff-badge staff-stock-warn">Crítico (≤{p.stockCritico})</span>
                          ) : (
                            <span className="staff-badge staff-stock-ok">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Alumnos */}
        {tab === 'alumnos' && (
          <div className="card" style={{ padding: '20px' }} data-testid="panel-alumnos">
            <div className="section-heading" style={{ marginBottom: '15px' }}>
              <div>
                <span className="eyebrow">ESTUDIANTES</span>
                <h2>Nómina y Estado de Cuentas</h2>
              </div>
            </div>

            <div className="staff-history-scroll">
              <table className="staff-history-table">
                <thead>
                  <tr>
                    <th>RUT</th>
                    <th>Nombre Alumno</th>
                    <th>Curso</th>
                    <th style={{ textAlign: 'right' }}>Saldo Total</th>
                    <th style={{ textAlign: 'right' }}>Comprometido</th>
                    <th style={{ textAlign: 'right' }}>Disponible</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((a) => (
                    <tr key={a.id}>
                      <td><code>{a.rut}</code></td>
                      <td><strong>{a.nombre}</strong></td>
                      <td>{a.curso}</td>
                      <td style={{ textAlign: 'right' }}>${a.balance.toLocaleString('es-CL')}</td>
                      <td style={{ textAlign: 'right', color: '#b45309' }}>${a.saldoComprometido.toLocaleString('es-CL')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#173b31' }}>
                        ${a.saldoDisponible.toLocaleString('es-CL')}
                      </td>
                      <td>
                        <span className="staff-badge staff-stock-ok">Activo</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Preparación en Librería */}
        {tab === 'reservas' && (
          <div className="card" style={{ padding: '20px' }} data-testid="panel-reservas">
            <div className="section-heading" style={{ marginBottom: '15px' }}>
              <div>
                <span className="eyebrow">OPERACIÓN DE MESÓN</span>
                <h2>Preparación y Entrega de Pedidos</h2>
              </div>
            </div>

            {reservas.length === 0 ? (
              <p className="muted">No hay pedidos registrados.</p>
            ) : (
              <div className="staff-history-scroll">
                <table className="staff-history-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Alumno</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th>Estado Actual</th>
                      <th>Código Bolsa</th>
                      <th style={{ textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.codigo}</strong></td>
                        <td>{r.nombreAlumno}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>${r.total.toLocaleString('es-CL')}</td>
                        <td><span className="staff-badge">{r.estado}</span></td>
                        <td>{r.codigoBolsa ? <code>{r.codigoBolsa}</code> : '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {r.estado === 'PENDIENTE' && (
                            <button
                              type="button"
                              className="staff-history-toggle"
                              onClick={() => avanzarEstadoReserva(r.id, 'EN_PREPARACION')}
                            >
                              ▶ Iniciar Preparación
                            </button>
                          )}
                          {r.estado === 'EN_PREPARACION' && (
                            <button
                              type="button"
                              className="staff-history-toggle"
                              style={{ background: '#fef3c7', color: '#b45309' }}
                              onClick={() => avanzarEstadoReserva(r.id, 'ETIQUETA_PENDIENTE')}
                            >
                              🏷 Generar Rótulo
                            </button>
                          )}
                          {r.estado === 'ETIQUETA_PENDIENTE' && (
                            <button
                              type="button"
                              className="staff-history-toggle"
                              style={{ background: '#dbeafe', color: '#1e40af' }}
                              onClick={() => avanzarEstadoReserva(r.id, 'LISTA_PARA_RETIRO')}
                            >
                              ✓ Lista para Retiro
                            </button>
                          )}
                          {r.estado === 'LISTA_PARA_RETIRO' && (
                            <button
                              type="button"
                              className="btn secondary"
                              style={{ fontSize: '12px', padding: '4px 10px' }}
                              onClick={() => avanzarEstadoReserva(r.id, 'ENTREGADA')}
                            >
                              📦 Entregar y Cerrar
                            </button>
                          )}
                          {(r.estado === 'ENTREGADA' || r.estado === 'CANCELADA') && (
                            <span className="muted" style={{ fontSize: '12px' }}>Finalizado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};
