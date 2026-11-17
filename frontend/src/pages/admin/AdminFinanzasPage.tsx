import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

const SALDO_INICIAL_CAJA = 500000;

export const AdminFinanzasPage: React.FC = () => {
  const { reservas } = useCart();
  const entregadas = reservas.filter((r) => r.estado === 'ENTREGADA');
  const totalVentas = entregadas.reduce((acc, r) => acc + r.total, 0);
  const saldoCaja = SALDO_INICIAL_CAJA + totalVentas;

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <Link to="/admin" className="back-link">← Volver a Administración</Link>

        <span className="eyebrow">ADMINISTRACIÓN</span>
        <h1>Cuenta Librería</h1>
        <p className="muted">Cartola de caja de la librería escolar: saldo, ingresos por ventas entregadas y apertura del período.</p>

        <div className="card" style={{ padding: '18px 20px', margin: '15px 0', background: '#f5f7f4' }}>
          <span>Saldo actual en Cuenta Librería: </span>
          <strong style={{ fontSize: '24px', color: '#173b31' }}>${saldoCaja.toLocaleString('es-CL')}</strong>
        </div>

        <section className="card" style={{ padding: '20px' }}>
          <h2>Cartola de movimientos</h2>
          <div className="staff-history-scroll" style={{ marginTop: '12px' }}>
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
                {entregadas.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.fechaCreacion).toLocaleDateString('es-CL')}</td>
                    <td><span className="staff-badge staff-stock-ok">INGRESO</span></td>
                    <td>Venta por entrega de reserva ({r.nombreAlumno})</td>
                    <td>{r.codigo}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                      +${r.total.toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>2026-10-01</td>
                  <td><span className="staff-badge">APERTURA</span></td>
                  <td>Saldo inicial de caja del período</td>
                  <td>SALDO-INIT</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>${SALDO_INICIAL_CAJA.toLocaleString('es-CL')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
};
