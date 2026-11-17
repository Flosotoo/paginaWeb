import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';

interface RegistroFirma {
  fecha: string;
  factura: string;
  decision: 'APROBADO' | 'RECHAZADO';
  monto: number;
}

const HISTORIAL_DEMO: RegistroFirma[] = [
  { fecha: '2026-10-05', factura: 'FAC-870', decision: 'APROBADO', monto: 23800 },
  { fecha: '2026-09-28', factura: 'FAC-861', decision: 'RECHAZADO', monto: 9100 },
];

export const AutorizadorHistorialPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <Link to="/autorizador" className="back-link">← Volver al panel</Link>

        <span className="eyebrow">AUTORIZADOR</span>
        <h1>Historial de autorizaciones</h1>
        <p className="muted">Registro de segundas firmas resueltas (auditoría de control).</p>

        <section className="card" style={{ padding: '20px', marginTop: '15px' }}>
          <div className="staff-history-scroll">
            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Factura</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ textAlign: 'center' }}>Decisión</th>
                </tr>
              </thead>
              <tbody>
                {HISTORIAL_DEMO.map((r) => (
                  <tr key={r.factura}>
                    <td>{r.fecha}</td>
                    <td><strong>{r.factura}</strong></td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>${r.monto.toLocaleString('es-CL')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`staff-badge ${r.decision === 'APROBADO' ? 'staff-stock-ok' : 'staff-stock-low'}`}>
                        {r.decision}
                      </span>
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
