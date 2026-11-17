import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

export const AdminInventarioPage: React.FC = () => {
  const { productos } = useCart();
  const valorInventario = productos.reduce((acc, p) => acc + p.cpp * p.stockFisico, 0);
  const criticos = productos.filter((p) => p.stockFisico - p.stockReservado <= p.stockCritico).length;

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <Link to="/admin" className="back-link">← Volver a Administración</Link>

        <span className="eyebrow">ADMINISTRACIÓN</span>
        <h1>Inventario Valorizado</h1>
        <p className="muted">Existencias, stock reservado/disponible y valorización por costo promedio ponderado (CPP).</p>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', margin: '15px 0 25px' }}>
          <div className="card" style={{ padding: '16px 20px' }}>
            <span className="eyebrow">VALOR INVENTARIO (CPP)</span>
            <strong style={{ fontSize: '22px', color: '#173b31', display: 'block' }}>
              ${valorInventario.toLocaleString('es-CL')}
            </strong>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <span className="eyebrow">SKUS EN NIVEL CRÍTICO</span>
            <strong style={{ fontSize: '22px', color: criticos > 0 ? '#b45309' : '#15803d', display: 'block' }}>
              {criticos}
            </strong>
          </div>
        </div>

        <section className="card" style={{ padding: '20px' }}>
          <div className="staff-history-scroll">
            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Material</th>
                  <th style={{ textAlign: 'center' }}>Físico</th>
                  <th style={{ textAlign: 'center' }}>Reservado</th>
                  <th style={{ textAlign: 'center' }}>Disponible</th>
                  <th style={{ textAlign: 'right' }}>CPP</th>
                  <th style={{ textAlign: 'right' }}>Valor línea</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const disp = p.stockFisico - p.stockReservado;
                  return (
                    <tr key={p.id}>
                      <td><code>{p.sku}</code></td>
                      <td><strong>{p.nombre}</strong></td>
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>{p.stockFisico}</td>
                      <td style={{ textAlign: 'center', color: '#b45309' }}>{p.stockReservado}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: disp <= p.stockCritico ? '#b45309' : '#173b31' }}>{disp}</td>
                      <td style={{ textAlign: 'right' }}>${p.cpp.toLocaleString('es-CL')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>${(p.cpp * p.stockFisico).toLocaleString('es-CL')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
};
