import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !clave.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (correo.includes('admin2') || correo.includes('autorizador')) {
      navigate('/admin');
    } else if (correo.includes('admin')) {
      navigate('/admin');
    } else if (correo.includes('encargado') || correo.includes('libreria')) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleSelectDemo = (email: string, pass: string) => {
    setCorreo(email);
    setClave(pass);
    setError('');
  };

  return (
    <main className="login">
      <section className="login-visual">
        <Link to="/login" className="brand brand-light" aria-label="EduSaldo inicio">
          <span className="brand-mark">
            e<span>·</span>
          </span>
          <span>
            edu<strong>saldo</strong><i>.</i>
          </span>
        </Link>

        <div className="visual-copy">
          <span className="eyebrow pale">EDUSALDO · TU ESPACIO FAMILIAR</span>
          <h1>
            Todo lo que acompaña<br />
            su aprendizaje,<br />
            <em>más cerca de ti.</em>
          </h1>
        </div>

        <span className="visual-foot">EduSaldo · Proyecto académico</span>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <span className="eyebrow">ACCESO A TU CUENTA</span>
          <h2>
            Ingresa para apoyar<br />
            <em>su día escolar.</em>
          </h2>
          <p className="muted">
            Consulta los saldos y movimientos de los estudiantes a tu cargo desde un solo lugar.
          </p>

          <form id="login-form" onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                className="input"
                type="email"
                placeholder="nombre@correo.cl"
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="clave">Contraseña</label>
              <input
                id="clave"
                className="input"
                type="password"
                placeholder="Tu contraseña"
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
              />
            </div>

            {error && <div className="alert" role="alert">{error}</div>}

            <button className="btn btn-wide" type="submit">
              Ingresar a mi cuenta <span aria-hidden="true">→</span>
            </button>
          </form>

          <button id="recovery-open" className="account-text-button" type="button">
            ¿Olvidaste tu contraseña?
          </button>

          <details className="demo">
            <summary>Ver accesos de demostración</summary>
            <div>
              <code
                style={{ cursor: 'pointer', display: 'block', margin: '4px 0' }}
                onClick={() => handleSelectDemo('apoderado@edusaldo.cl', '1234')}
                title="Hacer clic para autocompletar"
              >
                apoderado@edusaldo.cl / 1234
              </code>
              <code
                style={{ cursor: 'pointer', display: 'block', margin: '4px 0' }}
                onClick={() => handleSelectDemo('encargado@edusaldo.cl', '1234')}
                title="Hacer clic para autocompletar"
              >
                encargado@edusaldo.cl / 1234
              </code>
              <code
                style={{ cursor: 'pointer', display: 'block', margin: '4px 0' }}
                onClick={() => handleSelectDemo('admin@edusaldo.cl', '1234')}
                title="Hacer clic para autocompletar"
              >
                admin@edusaldo.cl / 1234
              </code>
              <code
                style={{ cursor: 'pointer', display: 'block', margin: '4px 0' }}
                onClick={() => handleSelectDemo('admin2@edusaldo.cl', '1234')}
                title="Hacer clic para autocompletar"
              >
                admin2@edusaldo.cl / 1234
              </code>
              <p>
                Datos ficticios. Si cambias la contraseña del apoderado, el acceso 1234 dejará de funcionar para esa cuenta en este navegador. No utilices contraseñas reales: este prototipo no tiene autenticación de servidor.
              </p>
            </div>
          </details>
        </div>
      </section>
    </main>
  );
};
