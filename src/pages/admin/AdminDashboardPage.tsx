import React, { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

export const AdminDashboardPage: React.FC = () => {
  const { productos, alumnos } = useCart();
  const [subView, setSubView] = useState<'inicio' | 'finanzas' | 'inventario' | 'personas' | 'pagos' | 'compras'>('inicio');

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <header className="top">
          <span className="logo">EduSaldo · Administrador</span>
        </header>

        <span className="eyebrow">ADMINISTRADOR</span>
        <h1>{subView === 'inicio' ? 'Inicio' : subView.toUpperCase()}</h1>

        {subView === 'inicio' && (
          <>
            <section className="admin-welcome">
              <div>
                <span className="eyebrow">CENTRO GENERAL DE PADRES</span>
                <h2>Administración de la librería escolar</h2>
                <p>Selecciona el área que necesitas gestionar.</p>
              </div>
              <div className="admin-welcome-mark">
                e<span>·</span>
              </div>
            </section>

            {/* Las 6 tarjetas originales de administración */}
            <div className="admin-home-grid">
              <button
                type="button"
                className="admin-home-card"
                onClick={() => setSubView('finanzas')}
                style={{ textAlign: 'left', background: '#fffcf7', border: 'none', cursor: 'pointer', width: '100%' }}
              >
                <span className="admin-card-icon">$</span>
                <div>
                  <h3>Cuenta Librería</h3>
                  <p>Cartola, movimientos y resultados.</p>
                </div>
                <b>→</b>
              </button>

              <button
                type="button"
                className="admin-home-card"
                onClick={() => setSubView('inventario')}
                style={{ textAlign: 'left', background: '#fffcf7', border: 'none', cursor: 'pointer', width: '100%' }}
              >
                <span className="admin-card-icon">▦</span>
                <div>
                  <h3>Inventario y Valorización</h3>
                  <p>Stock físico, disponible y crítico.</p>
                </div>
                <b>→</b>
              </button>

              <button
                type="button"
                className="admin-home-card"
                onClick={() => setSubView('personas')}
                style={{ textAlign: 'left', background: '#fffcf7', border: 'none', cursor: 'pointer', width: '100%' }}
              >
                <span className="admin-card-icon">👥</span>
                <div>
                  <h3>Personas y Alumnos</h3>
                  <p>Cuentas de apoderados y nómina de estudiantes.</p>
                </div>
                <b>→</b>
              </button>

              <button
                type="button"
                className="admin-home-card"
                onClick={() => setSubView('compras')}
                style={{ textAlign: 'left', background: '#fffcf7', border: 'none', cursor: 'pointer', width: '100%' }}
              >
                <span className="admin-card-icon">📦</span>
                <div>
                  <h3>Gestión de Compras</h3>
                  <p>Órdenes de compra y proveedores.</p>
                </div>
                <b>→</b>
              </button>

              <button
                type="button"
                className="admin-home-card"
                onClick={() => setSubView('pagos')}
                style={{ textAlign: 'left', background: '#fffcf7', border: 'none', cursor: 'pointer', width: '100%' }}
              >
                <span className="admin-card-icon">💳</span>
                <div>
                  <h3>Pagos de Facturas</h3>
                  <p>Solicitudes de pago y facturas recepcionadas.</p>
                </div>
                <b>→</b>
              </button>
            </div>
          </>
        )}

        {subView !== 'inicio' && (
          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="staff-small"
              onClick={() => setSubView('inicio')}
              style={{ marginBottom: '15px' }}
            >
              ← Volver al inicio de administración
            </button>

            {subView === 'inventario' && (
              <div className="card" style={{ padding: '20px' }} data-testid="panel-inventario">
                <span className="eyebrow">INVENTARIO Y VALORIZACIÓN</span>
                <h2 style={{ margin: '5px 0 15px' }}>Existencias y Alertas de Stock</h2>
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

            {subView === 'personas' && (
              <div className="card" style={{ padding: '20px' }} data-testid="panel-alumnos">
                <span className="eyebrow">PERSONAS</span>
                <h2 style={{ margin: '5px 0 15px' }}>Nómina de Estudiantes y Saldos</h2>
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
                          <td><span className="staff-badge staff-stock-ok">Activo</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subView === 'finanzas' && (
              <div className="card" style={{ padding: '20px' }}>
                <span className="eyebrow">CUENTA LIBRERÍA</span>
                <h2 style={{ margin: '5px 0 15px' }}>Cartola Financiera (HU54, HU58)</h2>
                <div style={{ background: '#f5f7f4', padding: '16px', borderRadius: '12px', marginBottom: '15px' }}>
                  <span>Saldo actual en Cuenta Librería: </span>
                  <strong style={{ fontSize: '24px', color: '#173b31' }}>$530.500</strong>
                </div>
                <div className="staff-history-scroll">
                  <table className="staff-history-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Naturaleza</th>
                        <th>Concepto</th>
                        <th>Referencia</th>
                        <th style={{ textAlign: 'right' }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2026-10-12</td>
                        <td><span className="staff-badge staff-stock-ok">INGRESO</span></td>
                        <td>Aporte de saldo Webpay</td>
                        <td>ABO-501</td>
                        <td style={{ textAlign: 'right', color: '#15803d', fontWeight: 800 }}>+$20.000</td>
                      </tr>
                      <tr>
                        <td>2026-10-01</td>
                        <td><span className="staff-badge">APERTURA</span></td>
                        <td>Saldo inicial de caja del período</td>
                        <td>SALDO-INIT</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>$500.000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subView === 'pagos' && (
              <div className="card" style={{ padding: '20px' }}>
                <span className="eyebrow">PAGOS A PROVEEDORES</span>
                <h2 style={{ margin: '5px 0 15px' }}>Facturas Recepcionadas Pendientes de Pago</h2>
                <div className="staff-history-scroll">
                  <table className="staff-history-table">
                    <thead>
                      <tr>
                        <th>Factura</th>
                        <th>Proveedor</th>
                        <th>OC</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'center' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>FAC-882</strong></td>
                        <td>Distribuidora Escolar Aconcagua S.A.</td>
                        <td><code>OC-1001</code></td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>$11.900</td>
                        <td><span className="staff-badge staff-stock-warn">Pendiente Solicitud</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" className="btn secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>
                            Solicitar Pago →
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subView === 'compras' && (
              <div className="card" style={{ padding: '20px' }}>
                <span className="eyebrow">GESTIÓN DE COMPRAS</span>
                <h2 style={{ margin: '5px 0 15px' }}>Órdenes de Compra Vigentes</h2>
                <div className="staff-history-scroll">
                  <table className="staff-history-table">
                    <thead>
                      <tr>
                        <th>Número OC</th>
                        <th>Proveedor</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'right' }}>Total Neto</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>OC-1001</strong></td>
                        <td>Distribuidora Escolar Aconcagua S.A.</td>
                        <td>2026-10-12</td>
                        <td><span className="staff-badge staff-stock-ok">EMITIDA</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>$10.000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};
