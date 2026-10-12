import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export const AdminDashboardPage: React.FC = () => {
  const { productos, alumnos, reservas, avanzarEstadoReserva } = useCart();
  const [tab, setTab] = useState<'inventario' | 'alumnos' | 'reservas'>('inventario');

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Panel de Control Administrativo</h1>
          <p className="text-muted small mb-0">
            Supervisión integral de stock, cuentas de alumnos y flujo operativo de librería.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'inventario' ? 'active' : 'bg-white border text-dark'}`}
            onClick={() => setTab('inventario')}
            data-testid="tab-inventario"
          >
            📦 Inventario y Stock
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'alumnos' ? 'active' : 'bg-white border text-dark'}`}
            onClick={() => setTab('alumnos')}
            data-testid="tab-alumnos"
          >
            👥 Alumnos y Saldos
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'reservas' ? 'active' : 'bg-white border text-dark'}`}
            onClick={() => setTab('reservas')}
            data-testid="tab-reservas"
          >
            📋 Preparación de Reservas ({reservas.filter((r) => r.estado !== 'ENTREGADA' && r.estado !== 'CANCELADA').length})
          </button>
        </li>
      </ul>

      {/* Contenido Tab Inventario */}
      {tab === 'inventario' && (
        <div className="card shadow-sm border-0 p-3 bg-white" data-testid="panel-inventario">
          <h2 className="fs-5 fw-bold text-dark mb-3">Control de Stock Físico y Reservado</h2>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>SKU</th>
                  <th>Material</th>
                  <th>Categoría</th>
                  <th className="text-end">Precio</th>
                  <th className="text-center">Stock Físico</th>
                  <th className="text-center">Reservado</th>
                  <th className="text-center">Disponible</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const disp = p.stockFisico - p.stockReservado;
                  return (
                    <tr key={p.id}>
                      <td className="font-monospace small">{p.sku}</td>
                      <td>
                        <strong>{p.nombre}</strong>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary">{p.categoria}</span>
                      </td>
                      <td className="text-end">${p.precioVenta.toLocaleString('es-CL')}</td>
                      <td className="text-center fw-bold">{p.stockFisico}</td>
                      <td className="text-center text-warning fw-bold">{p.stockReservado}</td>
                      <td className="text-center fw-bold text-primary">{disp}</td>
                      <td>
                        {disp <= 0 ? (
                          <span className="badge bg-danger">Agotado</span>
                        ) : disp <= p.stockCritico ? (
                          <span className="badge bg-warning text-dark">Crítico (≤{p.stockCritico})</span>
                        ) : (
                          <span className="badge bg-success">Normal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contenido Tab Alumnos */}
      {tab === 'alumnos' && (
        <div className="card shadow-sm border-0 p-3 bg-white" data-testid="panel-alumnos">
          <h2 className="fs-5 fw-bold text-dark mb-3">Nómina de Estudiantes y Saldos</h2>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>RUT</th>
                  <th>Nombre Alumno</th>
                  <th>Curso</th>
                  <th className="text-end">Saldo Total</th>
                  <th className="text-end">Comprometido</th>
                  <th className="text-end">Disponible</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td className="font-monospace">{a.rut}</td>
                    <td>
                      <strong>{a.nombre}</strong>
                    </td>
                    <td>{a.curso}</td>
                    <td className="text-end fw-bold text-dark">${a.balance.toLocaleString('es-CL')}</td>
                    <td className="text-end text-warning">${a.saldoComprometido.toLocaleString('es-CL')}</td>
                    <td className="text-end fw-bold text-success">
                      ${a.saldoDisponible.toLocaleString('es-CL')}
                    </td>
                    <td>
                      <span className="badge bg-success">Activo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contenido Tab Reservas Operativas */}
      {tab === 'reservas' && (
        <div className="card shadow-sm border-0 p-3 bg-white" data-testid="panel-reservas">
          <h2 className="fs-5 fw-bold text-dark mb-3">Flujo Operativo de Entrega (Librería)</h2>
          {reservas.length === 0 ? (
            <p className="text-muted">No hay pedidos registrados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Código</th>
                    <th>Alumno</th>
                    <th>Total</th>
                    <th>Estado Actual</th>
                    <th>Etiqueta / Bolsa</th>
                    <th>Acción Operativa</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.codigo}</strong>
                      </td>
                      <td>{r.nombreAlumno}</td>
                      <td>${r.total.toLocaleString('es-CL')}</td>
                      <td>
                        <span className="badge bg-secondary">{r.estado}</span>
                      </td>
                      <td>{r.codigoBolsa ? <code className="fw-bold">{r.codigoBolsa}</code> : '—'}</td>
                      <td>
                        {r.estado === 'PENDIENTE' && (
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => avanzarEstadoReserva(r.id, 'EN_PREPARACION')}
                          >
                            ▶ Iniciar Preparación
                          </button>
                        )}
                        {r.estado === 'EN_PREPARACION' && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => avanzarEstadoReserva(r.id, 'ETIQUETA_PENDIENTE')}
                          >
                            🏷 Generar Etiqueta
                          </button>
                        )}
                        {r.estado === 'ETIQUETA_PENDIENTE' && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => avanzarEstadoReserva(r.id, 'LISTA_PARA_RETIRO')}
                          >
                            ✓ Marcar Lista Retiro
                          </button>
                        )}
                        {r.estado === 'LISTA_PARA_RETIRO' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => avanzarEstadoReserva(r.id, 'ENTREGADA')}
                          >
                            📦 Entregar y Cerrar
                          </button>
                        )}
                        {(r.estado === 'ENTREGADA' || r.estado === 'CANCELADA') && (
                          <span className="text-muted small">Finalizado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
