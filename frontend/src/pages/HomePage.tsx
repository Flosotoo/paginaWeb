import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';

export const HomePage: React.FC = () => {
  const { alumnos } = useCart();
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<number>(alumnos[0]?.id || 1);

  const selectedAlumno = alumnos.find((a) => a.id === selectedAlumnoId) || alumnos[0];

  return (
    <>
      <Navbar />
      <main className="dashboard family-dashboard">
        <section className="family-intro">
          <div>
            <span className="eyebrow">TU ESPACIO FAMILIAR</span>
            <h1>Hola, <span>Carlos Pérez</span>.</h1>
            <p>Selecciona un alumno para consultar su cuenta o reservar útiles escolares.</p>
          </div>
          <img
            id="family-original-art"
            src="/assets/img/materiales-escolares.svg"
            alt="Cuadernos y lápices"
          />
        </section>

        <section className="family-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MIS ALUMNOS</span>
              <h2>Sus cuentas, en un solo lugar</h2>
            </div>
            <span className="count-pill">{alumnos.length} estudiantes</span>
          </div>

          <div id="children" className="child-grid" aria-label="Seleccionar alumno">
            {alumnos.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`child-choice ${selectedAlumnoId === a.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedAlumnoId(a.id)}
                data-testid={`student-card-${a.id}`}
              >
                <div className="child-top">
                  <span className="child-avatar">{a.nombre.charAt(0)}</span>
                  <span className="choice-state">{a.activo ? 'Cuenta activa' : 'Inactivo'}</span>
                </div>
                <strong>{a.nombre}</strong>
                <small>{a.curso} · RUT {a.rut}</small>
                <div className="choice-bottom">
                  <div>
                    <small>Saldo disponible</small>
                    <br />
                    <b>${a.saldoDisponible.toLocaleString('es-CL')}</b>
                  </div>
                  <span className="link-like">Seleccionar →</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {selectedAlumno && (
          <section className="account-section">
            <div className="account-top">
              <div>
                <span className="eyebrow">CUENTA SELECCIONADA</span>
                <h2>{selectedAlumno.nombre}</h2>
                <p className="muted">{selectedAlumno.curso} · RUT {selectedAlumno.rut}</p>
              </div>
              <span className="selected-tag">{selectedAlumno.curso}</span>
            </div>

            <div className="account-grid">
              <div className="balance-panel">
                <span>SALDO DISPONIBLE</span>
                <strong>${selectedAlumno.saldoDisponible.toLocaleString('es-CL')}</strong>
                <p>
                  Saldo total en cuenta: ${selectedAlumno.balance.toLocaleString('es-CL')}
                  {selectedAlumno.saldoComprometido > 0 && (
                    <> (Comprometido en reservas: ${selectedAlumno.saldoComprometido.toLocaleString('es-CL')})</>
                  )}
                </p>
                <span className="balance-decoration">$</span>
              </div>

              <div className="d-flex flex-column justify-content-center gap-3 p-3">
                <Link to="/catalogo" className="btn btn-wide text-center">
                  🛍 Reservar Materiales para {selectedAlumno.nombre.split(' ')[0]}
                </Link>
                <Link to="/reservas" className="btn secondary text-center">
                  📋 Ver Historial de Reservas
                </Link>
              </div>
            </div>
          </section>
        )}

        <p className="footer-note">
          EduSaldo · Sistema integral de saldos y librería escolar digital.
        </p>
      </main>
    </>
  );
};
