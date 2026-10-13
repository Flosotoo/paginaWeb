import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';

export const AdminControlPage: React.FC = () => {
  const [umbral, setUmbral] = useState('3000');
  const [diasRevision, setDiasRevision] = useState('3');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [periodoEstado, setPeriodoEstado] = useState<'ABIERTO' | 'EN_REVISION' | 'CERRADO'>('ABIERTO');

  const handleGuardarParametros = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('✓ Parámetros operativos actualizados en ParametroSistema.');
  };

  const handleCerrarPeriodo = () => {
    if (confirm('¿Cerrar definitivamente el período 2026-09? Los movimientos pasarán a ser estrictamente inmutables (HU61).')) {
      setPeriodoEstado('CERRADO');
      setFeedback('✓ Período contable 2026-09 cerrado exitosamente.');
    }
  };

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <Link to="/admin" className="back-link">
          ← Volver a Administración
        </Link>

        <header className="top">
          <span className="logo">EduSaldo · Control y Cierre</span>
        </header>

        <span className="eyebrow">ADMINISTRADOR</span>
        <h1>Control y Parámetros</h1>
        <p className="muted">
          Configuración de umbrales de alerta, días de revisión y cierre de períodos contables mensuales.
        </p>

        {feedback && (
          <p className="form-feedback physical-success" style={{ marginBottom: '20px' }}>
            {feedback}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
          {/* Parámetros Operativos */}
          <section className="card" style={{ padding: '20px' }}>
            <span className="eyebrow">PARÁMETROS MAESTROS</span>
            <h2>Parámetros Operativos</h2>
            <form onSubmit={handleGuardarParametros} style={{ marginTop: '15px' }}>
              <div className="field" style={{ marginBottom: '12px' }}>
                <label>Umbral para aviso de saldo bajo ($)</label>
                <input
                  type="number"
                  className="input"
                  value={umbral}
                  onChange={(e) => setUmbral(e.target.value)}
                  required
                />
              </div>

              <div className="field" style={{ marginBottom: '18px' }}>
                <label>Días de revisión antes del cierre automático</label>
                <input
                  type="number"
                  className="input"
                  value={diasRevision}
                  min="1"
                  max="15"
                  onChange={(e) => setDiasRevision(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-wide">
                Guardar Parámetros
              </button>
            </form>
          </section>

          {/* Períodos Contables */}
          <section className="card" style={{ padding: '20px' }}>
            <span className="eyebrow">CIERRE MENSUAL (HU61)</span>
            <h2>Períodos Contables</h2>
            <p className="muted small">
              Al vencer el mes, pasa a EN_REVISION. Tras los días configurados, se cierra automáticamente.
            </p>

            <div className="staff-history-scroll" style={{ marginTop: '15px' }}>
              <table className="staff-history-table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>2026-10</strong></td>
                    <td><span className="staff-badge staff-stock-ok">ABIERTO</span></td>
                    <td><small className="muted">Vigente</small></td>
                  </tr>
                  <tr>
                    <td><strong>2026-09</strong></td>
                    <td>
                      <span className={`staff-badge ${periodoEstado === 'CERRADO' ? 'staff-stock-low' : 'staff-stock-warn'}`}>
                        {periodoEstado}
                      </span>
                    </td>
                    <td>
                      {periodoEstado !== 'CERRADO' ? (
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                          onClick={handleCerrarPeriodo}
                        >
                          Cerrar Período →
                        </button>
                      ) : (
                        <small className="muted">Inmutable</small>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Auditoría de Acciones Sensibles */}
        <section className="card" style={{ padding: '20px' }}>
          <h2>Auditoría de Acciones Sensibles (HU65)</h2>
          <div className="staff-history-scroll" style={{ marginTop: '12px' }}>
            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2026-10-12 17:40</td>
                  <td>Antonio Jara</td>
                  <td>ADMINISTRADOR</td>
                  <td>CAMBIAR_CONFIGURACION</td>
                  <td>ParametroSistema</td>
                </tr>
                <tr>
                  <td>2026-10-12 16:30</td>
                  <td>Carlos Pérez</td>
                  <td>APODERADO</td>
                  <td>CONFIRMAR_RESERVA</td>
                  <td>Reserva #RES-7457</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
};
