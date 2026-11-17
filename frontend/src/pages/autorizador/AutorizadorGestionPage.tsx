import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

const SALDO_INICIAL_CAJA = 500000;

export const AutorizadorGestionPage: React.FC = () => {
  const { reservas } = useCart();
  const entregadas = reservas.filter((r) => r.estado === 'ENTREGADA');
  const totalVentas = entregadas.reduce((acc, r) => acc + r.total, 0);
  const saldoCaja = SALDO_INICIAL_CAJA + totalVentas;

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <Link to="/autorizador" className="back-link">← Volver al panel</Link>

        <span className="eyebrow">AUTORIZADOR · SOLO LECTURA</span>
        <h1>Cuenta Librería</h1>
        <p className="muted">Consulta de la cartola de caja de la librería. Este perfil no modifica movimientos.</p>

        <div className="card" style={{ padding: '18px 20px', margin: '15px 0', background: '#f5f7f4' }}>
          <span>Saldo actual en Cuenta Librería: </span>
          <strong style={{ fontSize: '24px', color: '#173b31' }}>${saldoCaja.toLocaleString('es-CL')}</strong>
        </div>

        <section className="card" style={{ padding: '20px' }}>
          <h2>Movimientos recientes</h2>
          <div className="staff-history-scroll" style={{ marginTop: '12px' }}>
            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Referencia</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {entregadas.length === 0 && (
                  <tr>
                    <td colSpan={4}><span className="muted">Sin ventas registradas en el período.</span></td>
                  </tr>
                )}
                {entregadas.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.fechaCreacion).toLocaleDateString('es-CL')}</td>
                    <td>Venta por entrega ({r.nombreAlumno})</td>
                    <td>{r.codigo}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#15803d' }}>+${r.total.toLocaleString('es-CL')}</td>
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
