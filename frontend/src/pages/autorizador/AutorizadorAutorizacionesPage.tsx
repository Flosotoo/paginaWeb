import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';

interface PagoPendiente {
  factura: string;
  proveedor: string;
  oc: string;
  total: number;
  solicitadoPor: string;
}

const PENDIENTES_DEMO: PagoPendiente[] = [
  { factura: 'FAC-882', proveedor: 'Distribuidora Escolar Aconcagua S.A.', oc: 'OC-1001', total: 11900, solicitadoPor: 'Antonio Jara (Admin)' },
];

export const AutorizadorAutorizacionesPage: React.FC = () => {
  const [resueltos, setResueltos] = useState<Record<string, 'APROBADO' | 'RECHAZADO'>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const resolver = (fac: string, decision: 'APROBADO' | 'RECHAZADO') => {
    setResueltos((prev) => ({ ...prev, [fac]: decision }));
    setFeedback(`✓ Segunda firma registrada para Factura #${fac}: ${decision}.`);
  };

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <Link to="/autorizador" className="back-link">← Volver al panel</Link>

        <span className="eyebrow">AUTORIZADOR · SEGUNDA FIRMA</span>
        <h1>Autorizaciones pendientes</h1>
        <p className="muted">Pagos a proveedores que requieren doble firma para ejecutarse.</p>

        {feedback && <p className="form-feedback physical-success" style={{ margin: '15px 0' }}>{feedback}</p>}

        <section className="card" style={{ padding: '20px' }}>
          <div className="staff-history-scroll">
            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Proveedor</th>
                  <th>OC</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Solicitado por</th>
                  <th style={{ textAlign: 'center' }}>Decisión</th>
                </tr>
              </thead>
              <tbody>
                {PENDIENTES_DEMO.map((p) => (
                  <tr key={p.factura}>
                    <td><strong>{p.factura}</strong></td>
                    <td>{p.proveedor}</td>
                    <td><code>{p.oc}</code></td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>${p.total.toLocaleString('es-CL')}</td>
                    <td>{p.solicitadoPor}</td>
                    <td style={{ textAlign: 'center' }}>
                      {resueltos[p.factura] ? (
                        <span className={`staff-badge ${resueltos[p.factura] === 'APROBADO' ? 'staff-stock-ok' : 'staff-stock-low'}`}>
                          {resueltos[p.factura]}
                        </span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button type="button" className="btn" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => resolver(p.factura, 'APROBADO')}>✓ Aprobar</button>
                          <button type="button" className="btn secondary" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => resolver(p.factura, 'RECHAZADO')}>✕ Rechazar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
};
