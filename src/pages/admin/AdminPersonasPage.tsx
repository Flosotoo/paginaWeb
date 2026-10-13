import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';
import { Alumno } from '../../types';

export const AdminPersonasPage: React.FC = () => {
  const { alumnos } = useCart();
  const [listaAlumnos, setListaAlumnos] = useState<Alumno[]>(alumnos);
  const [apoderadoRut, setApoderadoRut] = useState('');
  const [apoderadoNombre, setApoderadoNombre] = useState('');
  const [apoderadoApellido, setApoderadoApellido] = useState('');
  const [apoderadoCorreo, setApoderadoCorreo] = useState('');

  const [alumnoRut, setAlumnoRut] = useState('');
  const [alumnoNombre, setAlumnoNombre] = useState('');
  const [alumnoCurso, setAlumnoCurso] = useState('');
  const [alumnoEdad, setAlumnoEdad] = useState('10');

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCrearApoderado = (e: React.FormEvent) => {
    e.preventDefault();
    const tempPass = 'Edu' + Math.floor(100000 + Math.random() * 900000);
    setFeedback(`✓ Cuenta de apoderado creada para ${apoderadoNombre} ${apoderadoApellido}. Contraseña temporal de demostración: ${tempPass}`);
    setApoderadoRut('');
    setApoderadoNombre('');
    setApoderadoApellido('');
    setApoderadoCorreo('');
  };

  const handleCrearAlumno = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo: Alumno = {
      id: Date.now(),
      rut: alumnoRut,
      nombre: alumnoNombre,
      curso: alumnoCurso,
      edad: Number(alumnoEdad),
      balance: 0,
      saldoComprometido: 0,
      saldoDisponible: 0,
      activo: true,
    };
    setListaAlumnos([...listaAlumnos, nuevo]);
    setFeedback(`✓ Alumno ${alumnoNombre} (${alumnoCurso}) registrado con éxito.`);
    setAlumnoRut('');
    setAlumnoNombre('');
    setAlumnoCurso('');
  };

  return (
    <>
      <Navbar />
      <main className="dashboard admin-dashboard">
        <Link to="/admin" className="back-link">
          ← Volver a Administración
        </Link>

        <header className="top">
          <span className="logo">EduSaldo · Personas y Cuentas</span>
        </header>

        <span className="eyebrow">ADMINISTRACIÓN</span>
        <h1>Personas y Alumnos</h1>
        <p className="muted">
          Crea cuentas de apoderados, asocia estudiantes y carga nóminas masivas en formato CSV.
        </p>

        {feedback && (
          <p className="form-feedback physical-success" style={{ marginBottom: '20px' }}>
            {feedback}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
          {/* Form Apoderado */}
          <section className="card" style={{ padding: '20px' }}>
            <span className="eyebrow">NUEVA CUENTA</span>
            <h2>Cuenta de Apoderado</h2>
            <form onSubmit={handleCrearApoderado} style={{ marginTop: '15px' }}>
              <div className="field" style={{ marginBottom: '10px' }}>
                <label>RUT apoderado</label>
                <input className="input" placeholder="Ej: 11.222.333-4" value={apoderadoRut} onChange={(e) => setApoderadoRut(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: '10px' }}>
                <label>Primer Nombre</label>
                <input className="input" placeholder="Nombre" value={apoderadoNombre} onChange={(e) => setApoderadoNombre(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: '10px' }}>
                <label>Apellidos</label>
                <input className="input" placeholder="Apellidos" value={apoderadoApellido} onChange={(e) => setApoderadoApellido(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: '15px' }}>
                <label>Correo electrónico</label>
                <input className="input" type="email" placeholder="apoderado@correo.cl" value={apoderadoCorreo} onChange={(e) => setApoderadoCorreo(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-wide">
                Crear cuenta en PRIMER_ACCESO
              </button>
            </form>
          </section>

          {/* Form Alumno */}
          <section className="card" style={{ padding: '20px' }}>
            <span className="eyebrow">NUEVO ESTUDIANTE</span>
            <h2>Registrar Alumno</h2>
            <form onSubmit={handleCrearAlumno} style={{ marginTop: '15px' }}>
              <div className="field" style={{ marginBottom: '10px' }}>
                <label>RUT alumno</label>
                <input className="input" placeholder="Ej: 22.333.444-5" value={alumnoRut} onChange={(e) => setAlumnoRut(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: '10px' }}>
                <label>Nombre completo</label>
                <input className="input" placeholder="Nombre y apellidos" value={alumnoNombre} onChange={(e) => setAlumnoNombre(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: '10px' }}>
                <label>Curso</label>
                <input className="input" placeholder="Ej: 4° Básico" value={alumnoCurso} onChange={(e) => setAlumnoCurso(e.target.value)} required />
              </div>
              <div className="field" style={{ marginBottom: '15px' }}>
                <label>Edad</label>
                <input className="input" type="number" min="3" max="25" value={alumnoEdad} onChange={(e) => setAlumnoEdad(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-wide">
                Agregar Alumno
              </button>
            </form>
          </section>
        </div>

        {/* Tabla de Alumnos */}
        <section className="card" style={{ padding: '20px' }}>
          <h2>Nómina de Alumnos Registrados</h2>
          <div className="staff-history-scroll" style={{ marginTop: '15px' }}>
            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombre Alumno</th>
                  <th>Curso</th>
                  <th>Edad</th>
                  <th style={{ textAlign: 'right' }}>Saldo Disponible</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {listaAlumnos.map((a) => (
                  <tr key={a.id}>
                    <td><code>{a.rut}</code></td>
                    <td><strong>{a.nombre}</strong></td>
                    <td>{a.curso}</td>
                    <td>{a.edad} años</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                      ${a.saldoDisponible.toLocaleString('es-CL')}
                    </td>
                    <td><span className="staff-badge staff-stock-ok">Activo</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
};
