import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

export const AdminComprasPage: React.FC = () => {
  const { productos } = useCart();
  const [selectedProdId, setSelectedProdId] = useState<number>(productos[0]?.id || 101);
  const [cant, setCant] = useState<number>(10);
  const [netUnit, setNetUnit] = useState<number>(1000);
  const [lineas, setLineas] = useState<Array<{ sku: string; nombre: string; cant: number; netUnit: number; totalNeto: number }>>([
    { sku: 'CUAD-UNI-01', nombre: 'Cuaderno universitario', cant: 10, netUnit: 1000, totalNeto: 10000 },
  ]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAgregarLinea = () => {
    const prod = productos.find((p) => p.id === selectedProdId);
    if (!prod) return;
    const nueva = {
      sku: prod.sku,
      nombre: prod.nombre,
      cant,
      netUnit,
      totalNeto: cant * netUnit,
    };
    setLineas([...lineas, nueva]);
  };

  const totalNeto = lineas.reduce((acc, l) => acc + l.totalNeto, 0);
  const iva = Math.round(totalNeto * 0.19);
  const total = totalNeto + iva;

  const handleEmitirOC = () => {
    const ocNum = 'OC-' + Math.floor(1000 + Math.random() * 9000);
    setFeedback(`✓ Orden de Compra ${ocNum} emitida exitosamente por un total de $${total.toLocaleString('es-CL')} (Neto: $${totalNeto.toLocaleString('es-CL')} + IVA 19%).`);
  };

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <Link to="/admin" className="back-link">
          ← Volver a Administración
        </Link>

        <header className="top">
          <span className="logo">EduSaldo · Compras</span>
        </header>

        <span className="eyebrow">GESTIÓN DE COMPRAS</span>
        <h1>Crear Orden de Compra</h1>
        <p className="muted">
          La Orden de Compra se confecciona en valores netos. EduSaldo calcula el IVA 19% y total automáticamente.
        </p>

        {feedback && (
          <p className="form-feedback physical-success" style={{ marginBottom: '20px' }}>
            {feedback}
          </p>
        )}

        <section className="card" style={{ padding: '24px', marginBottom: '25px' }}>
          <h2>Nueva Orden de Compra (Valores Netos)</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="field">
              <label>Proveedor</label>
              <select className="input">
                <option value="1">Distribuidora Escolar Aconcagua S.A. (76.123.456-7)</option>
              </select>
            </div>

            <div className="field">
              <label>Agregar Producto al pedido</label>
              <select
                className="input"
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(Number(e.target.value))}
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' }}>
            <div className="field" style={{ width: '120px' }}>
              <label>Cantidad</label>
              <input
                className="input"
                type="number"
                min="1"
                value={cant}
                onChange={(e) => setCant(Number(e.target.value) || 1)}
              />
            </div>
            <div className="field" style={{ width: '160px' }}>
              <label>Neto Unitario ($)</label>
              <input
                className="input"
                type="number"
                min="1"
                value={netUnit}
                onChange={(e) => setNetUnit(Number(e.target.value) || 1)}
              />
            </div>
            <button type="button" className="btn secondary" onClick={handleAgregarLinea}>
              + Añadir línea
            </button>
          </div>

          <div className="staff-history-scroll" style={{ marginTop: '20px' }}>
            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Neto Unitario</th>
                  <th style={{ textAlign: 'right' }}>Neto Línea</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, idx) => (
                  <tr key={idx}>
                    <td><code>{l.sku}</code></td>
                    <td><strong>{l.nombre}</strong></td>
                    <td style={{ textAlign: 'center' }}>{l.cant}</td>
                    <td style={{ textAlign: 'right' }}>${l.netUnit.toLocaleString('es-CL')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>${l.totalNeto.toLocaleString('es-CL')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="staff-history-toggle"
                        style={{ color: '#b91c1c' }}
                        onClick={() => setLineas(lineas.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="reserva-aside" style={{ maxWidth: '350px', marginLeft: 'auto', marginTop: '20px', padding: '16px' }}>
            <div className="reserva-amount">
              <span>Total Neto</span>
              <strong>${totalNeto.toLocaleString('es-CL')}</strong>
            </div>
            <div className="reserva-amount">
              <span>IVA 19%</span>
              <strong>${iva.toLocaleString('es-CL')}</strong>
            </div>
            <div className="reserva-amount" style={{ fontSize: '18px', borderBottom: 'none' }}>
              <span>TOTAL ORDEN DE COMPRA</span>
              <strong style={{ color: '#173b31' }}>${total.toLocaleString('es-CL')}</strong>
            </div>
            <button
              type="button"
              className="btn btn-wide aporte-primary"
              style={{ marginTop: '15px' }}
              onClick={handleEmitirOC}
            >
              Emitir Orden de Compra
            </button>
          </div>
        </section>
      </main>
    </>
  );
};
