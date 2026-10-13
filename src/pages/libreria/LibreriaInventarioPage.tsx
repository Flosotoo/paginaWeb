import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

export const LibreriaInventarioPage: React.FC = () => {
  const { productos } = useCart();

  return (
    <>
      <Navbar />
      <main className="dashboard staff-dashboard">
        <Link to="/libreria" className="back-link">
          ← Inicio del encargado
        </Link>

        <section className="staff-panel">
          <span className="eyebrow">ÁREA DEL ENCARGADO</span>
          <h1>Inventario de Librería</h1>
          <p>Consulta existencias, stock físico, reservado y disponible.</p>

          <div className="card" style={{ padding: '20px', marginTop: '15px' }}>
            <div className="staff-history-scroll">
              <table className="staff-history-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Material</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Precio</th>
                    <th style={{ textAlign: 'center' }}>Stock Físico</th>
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
        </section>
      </main>
    </>
  );
};
