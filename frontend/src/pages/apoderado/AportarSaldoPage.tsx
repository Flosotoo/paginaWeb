import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

export const AportarSaldoPage: React.FC = () => {
  const { alumnos } = useCart();
  const [alumnoId, setAlumnoId] = useState<number>(alumnos[0]?.id || 1);
  const [monto, setMonto] = useState<string>('10000');
  const [confirmado, setConfirmado] = useState(false);
  const [step, setStep] = useState<'formulario' | 'webpay' | 'exito'>('formulario');
  const [error, setError] = useState('');
  const [tokenSimulado, setTokenSimulado] = useState('');

  const alumno = alumnos.find((a) => a.id === alumnoId) || alumnos[0];
  const montoNum = Number(monto.replace(/[^0-9]/g, '')) || 0;
  const saldoProyectado = alumno ? alumno.saldoDisponible + montoNum : 0;

  const handleIrAWebpay = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (montoNum < 1000) {
      setError('El monto mínimo para recargar es de $1.000 CLP.');
      return;
    }
    if (!confirmado) {
      setError('Debes confirmar el monto antes de continuar.');
      return;
    }
    setTokenSimulado('TBK-' + Math.floor(100000 + Math.random() * 900000));
    setStep('webpay');
  };

  const handleAprobarWebpay = () => {
    if (alumno) {
      alumno.balance += montoNum;
      alumno.saldoDisponible += montoNum;
    }
    setStep('exito');
  };

  return (
    <>
      <Navbar />
      <main className="dashboard detail-dashboard">
        <Link to="/" className="back-link">
          ← Volver a la cuenta
        </Link>

        {alumno && (
          <section className="detail-hero detail-hero-compact aporte-student-strip">
            <span className="eyebrow">ABONO PARA EL ALUMNO</span>
            <div className="detail-person">
              <span className="detail-avatar">{alumno.nombre.charAt(0)}</span>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px' }}>{alumno.nombre}</h1>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
                  {alumno.curso} · RUT {alumno.rut}
                </p>
              </div>
            </div>
            <div className="detail-balance">
              <span>Saldo disponible actual</span>
              <strong>${alumno.saldoDisponible.toLocaleString('es-CL')}</strong>
            </div>
          </section>
        )}

        <section className="aporte-panel">
          <span className="eyebrow">PASARELA DIGITAL</span>
          <h2>Abonar Saldo con Webpay (Simulado)</h2>
          <p className="aporte-intro">
            Ingresa el monto que deseas incorporar al saldo de este estudiante.
          </p>

          {step === 'formulario' && (
            <div id="aporte-step">
              <form onSubmit={handleIrAWebpay}>
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="student-sel" style={{ fontSize: '12px', fontWeight: 800, display: 'block', marginBottom: '5px' }}>
                    Selecciona Alumno:
                  </label>
                  <select
                    id="student-sel"
                    className="input"
                    value={alumnoId}
                    onChange={(e) => setAlumnoId(Number(e.target.value))}
                  >
                    {alumnos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} (Saldo: ${a.saldoDisponible.toLocaleString('es-CL')})
                      </option>
                    ))}
                  </select>
                </div>

                <label className="aporte-label" htmlFor="aporte-monto">
                  Monto del abono en pesos chilenos
                </label>
                <div className="amount-field">
                  <span aria-hidden="true">$</span>
                  <input
                    id="aporte-monto"
                    name="monto"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej.: 10.000"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                  />
                  <span className="amount-currency">CLP</span>
                </div>

                <p id="aporte-ayuda" className="aporte-hint">
                  Escribe solo números: EduSaldo proyecta el saldo resultante automáticamente.
                </p>

                {error && <p className="form-feedback feedback-error">{error}</p>}

                <div className="aporte-summary">
                  <div>
                    <span>Monto a recargar</span>
                    <strong>${montoNum.toLocaleString('es-CL')}</strong>
                  </div>
                  <div>
                    <span>Saldo proyectado tras aprobación</span>
                    <strong style={{ color: '#15803d' }}>${saldoProyectado.toLocaleString('es-CL')}</strong>
                  </div>
                </div>

                <label className="aporte-confirm" htmlFor="aporte-confirmar">
                  <input
                    type="checkbox"
                    id="aporte-confirmar"
                    checked={confirmado}
                    onChange={(e) => setConfirmado(e.target.checked)}
                  />
                  <span>
                    Confirmo que el monto indicado es el que deseo abonar mediante Webpay simulado.
                  </span>
                </label>

                <button type="submit" className="aporte-primary btn btn-wide">
                  Continuar a Webpay (simulación) →
                </button>
              </form>
            </div>
          )}

          {step === 'webpay' && (
            <div className="card" style={{ padding: '30px', textAlign: 'center', background: '#f5f7f4', maxWidth: '500px', margin: '20px auto' }}>
              <span className="eyebrow">WEBPAY PLUS · AMBIENTE SIMULADO</span>
              <h3 style={{ margin: '10px 0' }}>Confirmación Transaccional</h3>
              <p className="muted small">
                Transbank Demo Token: <code>{tokenSimulado}</code>
              </p>
              <div style={{ background: 'white', padding: '15px', borderRadius: '10px', margin: '15px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Comercio:</span>
                  <strong>Librería Escolar EduSaldo</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Alumno:</span>
                  <strong>{alumno?.nombre}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800 }}>
                  <span>Total a Pagar:</span>
                  <span style={{ color: '#173b31' }}>${montoNum.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button type="button" className="btn btn-wide aporte-primary" onClick={handleAprobarWebpay}>
                  ✓ Aprobar Pago Simulado
                </button>
                <button type="button" className="btn secondary" onClick={() => setStep('formulario')}>
                  ✕ Cancelar
                </button>
              </div>
            </div>
          )}

          {step === 'exito' && (
            <div className="card" style={{ padding: '30px', textAlign: 'center', background: '#f0fdf4', border: '1px solid #86efac', maxWidth: '500px', margin: '20px auto' }}>
              <span className="eyebrow" style={{ color: '#15803d' }}>PAGO EXITOSO</span>
              <h3 style={{ margin: '10px 0', color: '#15803d' }}>¡Aporte Acreditado!</h3>
              <p style={{ margin: '0 0 15px' }}>
                Se han incorporado <strong>${montoNum.toLocaleString('es-CL')}</strong> al saldo de <strong>{alumno?.nombre}</strong>.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <Link to="/" className="btn btn-wide aporte-primary">
                  Ver Cuentas de Alumnos
                </Link>
                <Link to="/catalogo" className="btn secondary">
                  Ir al Catálogo
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
};
