import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';

export const LibreriaRecepcionPage: React.FC = () => {
  const [facturaNumero, setFacturaNumero] = useState('');
  const [totalFactura, setTotalFactura] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facturaNumero.trim() || !totalFactura.trim()) {
      setFeedback({ tipo: 'err', msg: 'Ingresa factura y total declarado.' });
      return;
    }

    setFeedback({
      tipo: 'ok',
      msg: `✓ Recepción conforme registrada. Factura #${facturaNumero} enviada a Finanzas para pago. Stock físico actualizado y CPP recalculado con IVA.`
    });
    setFacturaNumero('');
    setTotalFactura('');
  };

  return (
    <>
      <Navbar />
      <main className="dashboard staff-dashboard">
        <Link to="/libreria" className="back-link">
          ← Inicio del encargado
        </Link>

        <section className="staff-panel">
          <span className="eyebrow">ÁREA DEL ENCARGADO</span>
          <h1>Recepción de Compras</h1>
          <p>
            Compara la Orden de Compra física contra las facturas del SII y mercadería recibida. Variante B atómica.
          </p>

          <div className="card" style={{ padding: '20px', marginTop: '20px', maxWidth: '750px' }}>
            <h2>Recepción de Mercadería</h2>
            <p className="staff-note">
              OC demo: OC-1001 (Distribuidora Escolar Aconcagua S.A.) · 10 Cuadernos universitarios pedidos.
            </p>

            {feedback && (
              <p
                className={`form-feedback ${feedback.tipo === 'ok' ? 'physical-success' : 'feedback-error'}`}
                style={{ marginTop: '10px' }}
              >
                {feedback.msg}
              </p>
            )}

            <form onSubmit={handleConfirmar} style={{ marginTop: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="field">
                  <label htmlFor="num-fac">Número de Factura (SII)</label>
                  <input
                    id="num-fac"
                    className="input"
                    type="text"
                    placeholder="Ej: FAC-882"
                    value={facturaNumero}
                    onChange={(e) => setFacturaNumero(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="tot-fac">Total Factura con IVA ($)</label>
                  <input
                    id="tot-fac"
                    className="input"
                    type="text"
                    placeholder="Ej: 11900"
                    value={totalFactura}
                    onChange={(e) => setTotalFactura(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="staff-history-scroll" style={{ marginTop: '15px' }}>
                <table className="staff-history-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>SKU</th>
                      <th>Pedido</th>
                      <th>Recibo Ahora</th>
                      <th>Neto Unit.</th>
                      <th>Total c/IVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Cuaderno universitario</strong></td>
                      <td><code>CUAD-UNI-01</code></td>
                      <td>10</td>
                      <td>
                        <input
                          type="number"
                          defaultValue={10}
                          min={0}
                          max={10}
                          className="input"
                          style={{ width: '80px', padding: '4px' }}
                        />
                      </td>
                      <td>$1.000</td>
                      <td><strong>$1.190</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button type="submit" className="btn btn-wide aporte-primary" style={{ marginTop: '20px' }}>
                Confirmar Recepción Conforme (POST Atómico)
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
};
