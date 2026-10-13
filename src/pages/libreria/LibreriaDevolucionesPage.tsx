import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';
import { Alumno } from '../../types';

export const LibreriaDevolucionesPage: React.FC = () => {
  const { alumnos, productos } = useCart();
  const [rut, setRut] = useState('');
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [error, setError] = useState('');
  const [motivo, setMotivo] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleBuscar = () => {
    setError('');
    setFeedback(null);
    const cleanRut = rut.trim();
    const found = alumnos.find((a) => a.rut === cleanRut);
    if (!found) {
      setError('No se encontró una cuenta de alumno asociada a ese RUT.');
      setAlumno(null);
      return;
    }
    setAlumno(found);
  };

  const handleDevolver = (nombreProd: string, monto: number) => {
    if (!motivo.trim()) {
      setError('Por favor indica un motivo obligatorio para registrar la devolución.');
      return;
    }
    setFeedback(`✓ Devolución registrada para ${nombreProd}: se reintegraron $${monto.toLocaleString('es-CL')} al saldo de ${alumno?.nombre}. Motivo: ${motivo}`);
    setMotivo('');
  };

  return (
    <>
      <Navbar />
      <main className="dashboard staff-dashboard">
        <Link to="/libreria" className="back-link">
          ← Inicio del encargado
        </Link>

        <section className="staff-panel">
          <span className="eyebrow">OPERACIÓN DE LIBRERÍA</span>
          <h1>Devolución de Materiales</h1>
          <p>
            Reintegra saldo y unidades al inventario contra compras registradas. Solo se aceptan materiales sin uso en perfecto estado.
          </p>

          <div className="card" style={{ padding: '20px', marginTop: '20px', maxWidth: '650px' }}>
            <h2>Identificar al alumno</h2>
            <div className="staff-scan" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input
                type="text"
                className="input"
                placeholder="RUT del alumno (Ej: 12.345.678-5)"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
              />
              <button type="button" className="btn" onClick={handleBuscar}>
                Buscar
              </button>
            </div>

            {error && <p className="form-feedback feedback-error" style={{ marginTop: '10px' }}>{error}</p>}
            {feedback && <p className="form-feedback physical-success" style={{ marginTop: '10px' }}>{feedback}</p>}

            {alumno && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ background: '#f5f7f4', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                  <strong>{alumno.nombre}</strong> · {alumno.curso} · RUT {alumno.rut}
                  <br />
                  <span>Saldo actual: </span>
                  <strong style={{ color: '#15803d' }}>${alumno.saldoDisponible.toLocaleString('es-CL')}</strong>
                </div>

                <div className="field" style={{ marginBottom: '15px' }}>
                  <label htmlFor="motivo-dev">Motivo de la devolución (Obligatorio)</label>
                  <input
                    id="motivo-dev"
                    className="input"
                    type="text"
                    placeholder="Ej: Cambio de colegio, material duplicado, etc."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>

                <h3>Compras elegibles para devolución</h3>
                <div className="staff-history-scroll" style={{ marginTop: '10px' }}>
                  <table className="staff-history-table">
                    <thead>
                      <tr>
                        <th>Artículo</th>
                        <th>Precio Pagado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.slice(0, 3).map((p) => (
                        <tr key={p.id}>
                          <td><strong>{p.nombre}</strong></td>
                          <td>${p.precioVenta.toLocaleString('es-CL')}</td>
                          <td>
                            <button
                              type="button"
                              className="staff-history-toggle"
                              onClick={() => handleDevolver(p.nombre, p.precioVenta)}
                            >
                              Devolver unidad
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};
