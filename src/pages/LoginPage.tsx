import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_USERS } from '../data/mockData';
import { Usuario } from '../types';

export const LoginPage: React.FC = () => {
  const [rut, setRut] = useState('');
  const [pass, setPass] = useState('');
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario>(INITIAL_USERS[0]);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = INITIAL_USERS.find((usr) => usr.rut === rut.trim());
    if (u) {
      setUsuarioActivo(u);
      setMsg(`Sesión iniciada como ${u.name} ${u.last} (${u.type})`);
      setTimeout(() => {
        if (u.type === 'ADMINISTRADOR' || u.type === 'ENCARGADO' || u.type === 'AUTORIZADOR') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 1000);
    } else {
      setMsg('RUT no encontrado en la base de datos de demostración.');
    }
  };

  const handleSelectSimulado = (u: Usuario) => {
    setUsuarioActivo(u);
    setRut(u.rut);
    setPass('********');
    setMsg(`Perfil seleccionado: ${u.name} ${u.last} (${u.type})`);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0 p-4 bg-white">
            <h1 className="h4 fw-bold text-dark text-center mb-1">Acceso EduSaldo</h1>
            <p className="text-muted text-center small mb-4">
              Ingresa tus credenciales o selecciona un perfil de demostración
            </p>

            {msg && <div className="alert alert-info py-2 small">{msg}</div>}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">RUT de Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: 9.876.543-2"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Tu contraseña"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
                Iniciar Sesión
              </button>
            </form>

            <hr className="my-4" />

            <h3 className="fs-6 fw-bold text-muted mb-2 text-center text-uppercase" style={{ fontSize: '0.75rem' }}>
              Cuentas de Demostración
            </h3>
            <div className="d-grid gap-2">
              {INITIAL_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`btn btn-sm text-start ${usuarioActivo.id === u.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => handleSelectSimulado(u)}
                >
                  <strong>{u.name} {u.last}</strong> · <span className="small">{u.type}</span> ({u.rut})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
