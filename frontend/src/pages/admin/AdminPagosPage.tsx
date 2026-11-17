import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';

interface PagoProveedor {
  factura: string;
  proveedor: string;
  oc: string;
  total: number;
}

const PAGOS_DEMO: PagoProveedor[] = [
  { factura: 'FAC-882', proveedor: 'Distribuidora Escolar Aconcagua S.A.', oc: 'OC-1001', total: 11900 },
  { factura: 'FAC-905', proveedor: 'Comercial Lápiz Azul Ltda.', oc: 'OC-1002', total: 48300 },
];

export const AdminPagosPage: React.FC = () => {
  const [solicitados, setSolicitados] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSolicitar = (fac: string) => {
    setSolicitados((prev) => ({ ...prev, [fac]: true }));
    setFeedback(`✓ Factura #${fac} enviada a segunda firma del autorizador.`);
  };

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <Link to="/admin" className="back-link">← Volver a Administración</Link>

        <span className="eyebrow">ADMINISTRACIÓN</span>
        <h1>Pagos a Proveedores</h1>
        <p className="muted">Solicita el pago de facturas recepcionadas. El pago final requiere segunda firma del autorizador.</p>

        {feedback && (
          <p className="form-feedback physical-success" style={{ margin: '15px 0' }}>{feedback}</p>
        )}

        <section className="card" style={{ padding: '20px' }}>
          <div className="staff-history-scroll">
            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Proveedor</th>
                  <th>OC</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {PAGOS_DEMO.map((p) => (
                  <tr key={p.factura}>
                    <td><strong>{p.factura}</strong></td>
                    <td>{p.proveedor}</td>
                    <td><code>{p.oc}</code></td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>${p.total.toLocaleString('es-CL')}</td>
                    <td style={{ textAlign: 'center' }}>
                      {solicitados[p.factura] ? (
                        <span className="staff-badge staff-stock-warn">En 2da firma</span>
                      ) : (
                        <span className="staff-badge">Por solicitar</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {!solicitados[p.factura] ? (
                        <button type="button" className="btn secondary" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => handleSolicitar(p.factura)}>
                          Solicitar pago →
                        </button>
                      ) : (
                        <small className="muted">Enviada</small>
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
