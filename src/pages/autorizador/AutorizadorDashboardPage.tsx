import React, { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';

export const AutorizadorDashboardPage: React.FC = () => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pagosResueltos, setPagosResueltos] = useState<Record<string, 'APROBADO' | 'RECHAZADO'>>({});

  const handleResolverPago = (fac: string, decision: 'APROBADO' | 'RECHAZADO') => {
    setPagosResueltos({ ...pagosResueltos, [fac]: decision });
    setFeedback(`✓ Segunda firma registrada para Factura #${fac}: ${decision}.`);
  };

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <header className="top">
          <span className="logo">EduSaldo · Control y segunda firma</span>
        </header>

        <span className="eyebrow">ADMINISTRADOR 2 · CONTROL</span>
        <h1>Gestión y autorizaciones</h1>

        <section className="admin-welcome" style={{ marginBottom: '24px' }}>
          <div>
            <span className="eyebrow">CENTRO GENERAL DE PADRES</span>
            <h2>Consulta financiera y segunda firma</h2>
            <p>
              Este perfil es de control. Puedes consultar la Cuenta Librería en modo solo lectura y actuar cuando una gestión requiera segunda autorización (doble firma).
            </p>
          </div>
          <div className="admin-welcome-mark">
            e<span>·</span>
          </div>
        </section>

        {feedback && (
          <p className="form-feedback physical-success" style={{ marginBottom: '20px' }}>
            {feedback}
          </p>
        )}

        {/* Panel de Autorizaciones de Pago */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <span className="eyebrow">SEGUNDA FIRMA REQUERIDA</span>
          <h2 style={{ fontSize: '20px', margin: '5px 0 15px' }}>Pagos de Facturas a Proveedores</h2>

          <div className="staff-history-scroll">
            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Proveedor</th>
                  <th>OC Referencia</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Solicitado Por</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Decisión (Segunda Firma)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>FAC-882</strong></td>
                  <td>Distribuidora Escolar Aconcagua S.A.</td>
                  <td><code>OC-1001</code></td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>$11.900</td>
                  <td>Antonio Jara (Admin)</td>
                  <td>
                    {pagosResueltos['FAC-882'] ? (
                      <span className={`staff-badge ${pagosResueltos['FAC-882'] === 'APROBADO' ? 'staff-stock-ok' : 'staff-stock-low'}`}>
                        {pagosResueltos['FAC-882']}
                      </span>
                    ) : (
                      <span className="staff-badge staff-stock-warn">Pendiente 2da firma</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {!pagosResueltos['FAC-882'] ? (
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ fontSize: '12px', padding: '4px 10px' }}
                          onClick={() => handleResolverPago('FAC-882', 'APROBADO')}
                        >
                          ✓ Aprobar
                        </button>
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ fontSize: '12px', padding: '4px 10px' }}
                          onClick={() => handleResolverPago('FAC-882', 'RECHAZADO')}
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    ) : (
                      <small className="muted">Firma registrada</small>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Consulta Cuenta Librería (Solo Lectura) */}
        <div className="card" style={{ padding: '24px' }}>
          <span className="eyebrow">MODO SOLO LECTURA</span>
          <h2 style={{ fontSize: '20px', margin: '5px 0 15px' }}>Cuenta Librería · Cartola de Caja</h2>

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
                  <td>Aporte de saldo alumno Webpay</td>
                  <td>ABO-501</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#15803d' }}>+$20.000</td>
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
      </main>
    </>
  );
};
