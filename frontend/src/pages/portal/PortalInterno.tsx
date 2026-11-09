import { HistorialOperativo } from "./HistorialOperativo";
import { CancelacionReserva } from "./CancelacionReserva";
import { Administracion } from "./Administracion";
import { CambiarClave } from "./CambiarClave";
import { CorreosSimulados } from "./CorreosSimulados";
import { Privacidad } from "./Privacidad";
import { CorreccionDatos } from "./CorreccionDatos";
import { EntregaMeson } from "./EntregaMeson";
import { GestionCatalogo } from "./GestionCatalogo";
import { GestionUsuarios } from "./GestionUsuarios";
import { usePortalInterno } from "../../hooks/usePortalInterno";

interface PortalInternoProps {
  seccion: string;
  setSeccion: (s: string) => void;
}

export function PortalInterno({ seccion, setSeccion }: PortalInternoProps) {
  const {
    usuario,
    aviso,
    producto,
    setProducto,
    cantidad,
    setCantidad,
    motivo,
    setMotivo,
    procesando,
    reservas,
    productos,
    ajustes,
    movimientos,
    solicitar,
    preparar,
    entregar,
    cancelar,
    aprobar,
    rechazar,
  } = usePortalInterno();

  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  const porPreparar =
    reservas.datos?.filter((r) => r.estado === "PENDIENTE").length ?? 0;
  const pendientesEntrega =
    reservas.datos?.filter((r) => r.estado === "LISTA_PARA_RETIRO").length ?? 0;
  const stockCritico =
    productos.datos?.filter((p) => p.stockDisponible <= (p.stockCritico || 5))
      .length ?? 0;
  const entregadas =
    reservas.datos?.filter((r) => r.estado === "ENTREGADA").length ?? 0;

  return (
    <main className="dashboard staff-dashboard">
      {aviso && <p role="status" className="form-feedback">{aviso}</p>}

      {/* VISTA INICIO PARA ENCARGADO */}
      {!esAdmin && seccion === "inicio" && (
        <>
          <section className="staff-hero">
            <span className="eyebrow">ÁREA DEL ENCARGADO</span>
            <h1>Materiales listos para cada día.</h1>
            <p>
              Prepara reservas, registra entregas y consulta existencias desde un solo lugar.
            </p>
          </section>

          <section className="staff-stats" id="staff-stats">
            <div className="staff-stat">
              <strong>{porPreparar}</strong>
              <span>Reservas por preparar</span>
            </div>
            <div className="staff-stat">
              <strong>{pendientesEntrega}</strong>
              <span>Reservas pendientes de entrega</span>
            </div>
            <div className="staff-stat">
              <strong>{stockCritico}</strong>
              <span>Disponibilidad crítica (≤ 5)</span>
            </div>
            <div className="staff-stat">
              <strong>{entregadas}</strong>
              <span>Reservas entregadas</span>
            </div>
          </section>

          <section className="staff-grid" style={{ marginBottom: "30px" }}>
            <button
              type="button"
              className="staff-tile"
              onClick={() => setSeccion("reservas")}
              style={{ textAlign: "left", cursor: "pointer", border: "none", width: "100%" }}
            >
              <span className="staff-symbol">▤</span>
              <span style={{ display: "block", font: '400 29px "DM Serif Display", Georgia, serif', margin: "8px 0" }}>Reservas</span>
              <p>Consulta reservas por preparar y pendientes de retiro.</p>
              <b>Ver reservas →</b>
            </button>
            <button
              type="button"
              className="staff-tile peach"
              onClick={() => setSeccion("entregas")}
              style={{ textAlign: "left", cursor: "pointer", border: "none", width: "100%" }}
            >
              <span className="staff-symbol">⌁</span>
              <span style={{ display: "block", font: '400 29px "DM Serif Display", Georgia, serif', margin: "8px 0" }}>Entrega directa</span>
              <p>Entrega presencial para alumnos en mesón de librería.</p>
              <b>Registrar entrega →</b>
            </button>
            <button
              type="button"
              className="staff-tile sage"
              onClick={() => setSeccion("inventario")}
              style={{ textAlign: "left", cursor: "pointer", border: "none", width: "100%" }}
            >
              <span className="staff-symbol">▦</span>
              <span style={{ display: "block", font: '400 29px "DM Serif Display", Georgia, serif', margin: "8px 0" }}>Existencias</span>
              <p>Consulta existencias físicas y solicita ajustes de stock.</p>
              <b>Ver inventario →</b>
            </button>
            <button
              type="button"
              className="staff-tile cream"
              onClick={() => setSeccion("historial")}
              style={{ textAlign: "left", cursor: "pointer", border: "none", width: "100%" }}
            >
              <span className="staff-symbol">↶</span>
              <span style={{ display: "block", font: '400 29px "DM Serif Display", Georgia, serif', margin: "8px 0" }}>Historial</span>
              <p>Revisa trazabilidad y movimientos registrados.</p>
              <b>Consultar →</b>
            </button>
          </section>
        </>
      )}

      {/* VISTA INICIO PARA ADMINISTRADOR */}
      {esAdmin && seccion === "inicio" && (
        <>
          <section className="admin-welcome" style={{ marginBottom: "25px" }}>
            <div>
              <span className="eyebrow">CENTRO GENERAL DE PADRES</span>
              <h2>Administración de la librería escolar</h2>
              <p>Supervisa inventario, nómina de usuarios, auditoría y cartola general.</p>
            </div>
            <div className="admin-welcome-mark">e</div>
          </section>

          <div className="admin-home-grid" style={{ marginBottom: "30px" }}>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("inventario")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">▦</span>
              <div>
                <h3>Inventario y Valorización</h3>
                <p>Stock físico, disponible y solicitudes de ajuste.</p>
              </div>
              <b>→</b>
            </button>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("personas")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">👥</span>
              <div>
                <h3>Personas y Alumnos</h3>
                <p>Cuentas de apoderados, nómina y vínculos.</p>
              </div>
              <b>→</b>
            </button>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("reservas")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">📋</span>
              <div>
                <h3>Reservas y Entregas</h3>
                <p>Control de pedidos y cancelaciones.</p>
              </div>
              <b>→</b>
            </button>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("auditoria")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">📊</span>
              <div>
                <h3>Auditoría y Parámetros</h3>
                <p>Historial contable y configuración institucional.</p>
              </div>
              <b>→</b>
            </button>
          </div>
        </>
      )}

      {/* MÓDULO: RESERVAS */}
      {seccion === "reservas" && (
        <section className="account-section" id="reservas">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
          </button>
          <div className="section-heading">
            <div>
              <span className="eyebrow">OPERACIONES</span>
              <h2 id="reservas">Reservas</h2>
            </div>
          </div>

          {reservas.error && <p role="alert">{reservas.error}</p>}
          {reservas.cargando && <p>Cargando reservas…</p>}
          {reservas.datos?.length === 0 && <p>No hay reservas.</p>}

          <div style={{ display: "grid", gap: "14px" }}>
            {reservas.datos?.map((r) => (
              <article key={r.id} className="card" style={{ padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span className={`staff-badge ${r.estado === "ENTREGADA" ? "staff-stock-ok" : r.estado === "CANCELADA" ? "staff-stock-bad" : "staff-stock-warn"}`}>
                      {r.estado}
                    </span>
                    <h3 style={{ margin: "6px 0 2px" }}>
                      {r.codigo} · {r.estado}
                    </h3>
                    <p style={{ margin: "4px 0", color: "var(--muted)", fontSize: "14px" }}>
                      Alumno {r.alumnoId} · ${r.total.toLocaleString("es-CL")}
                      {r.items?.length
                        ? ` · ${r.items.map((i) => `${i.nombreProducto} (${i.cantidad})`).join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {r.estado === "PENDIENTE" && (
                      <button
                        className="btn"
                        disabled={procesando}
                        onClick={() => preparar(r.id)}
                      >
                        Marcar lista
                      </button>
                    )}
                    {r.estado === "LISTA_PARA_RETIRO" && (
                      <button
                        className="btn"
                        disabled={procesando}
                        onClick={() => entregar(r.id)}
                      >
                        Registrar entrega
                      </button>
                    )}
                  </div>
                </div>
                {["PENDIENTE", "LISTA_PARA_RETIRO"].includes(r.estado) && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid #e8e4da", paddingTop: "10px" }}>
                    <CancelacionReserva
                      procesando={procesando}
                      cancelar={(motivo) => cancelar(r.id, motivo)}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* MÓDULO: INVENTARIO */}
      {seccion === "inventario" && (
        <section className="account-section" id="inventario">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
          </button>
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXISTENCIAS</span>
              <h2 id="inventario">Inventario</h2>
            </div>
          </div>

          {productos.error && <p role="alert">{productos.error}</p>}

          <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 12px" }}>Estado de Stock Actual</h3>
            <div style={{ display: "grid", gap: "8px" }}>
              {productos.datos?.map((p) => (
                <p key={p.id} style={{ margin: "4px 0", fontSize: "14px" }}>
                  <strong>{p.nombre}:</strong> {p.stockFisico} físicos · {p.stockReservado} reservados · {p.stockDisponible} disponibles
                </p>
              ))}
            </div>
          </div>

          {!esAdmin && (
            <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
              <span className="eyebrow">SOLICITUD DE MODIFICACIÓN</span>
              <h3 style={{ margin: "4px 0 14px" }}>Solicitar ajuste de stock</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  solicitar();
                }}
                style={{ display: "grid", gap: "12px", maxWidth: "500px" }}
              >
                <div>
                  <label htmlFor="producto-ajuste">Producto</label>
                  <select
                    id="producto-ajuste"
                    aria-label="Producto"
                    className="input"
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    required
                  >
                    <option value="">Selecciona</option>
                    {productos.datos?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cantidad-ajuste">Cantidad a ajustar</label>
                  <input
                    id="cantidad-ajuste"
                    className="input"
                    type="number"
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="motivo-ajuste">Motivo</label>
                  <input
                    id="motivo-ajuste"
                    className="input"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    required
                  />
                </div>
                <button className="btn" disabled={procesando} style={{ justifySelf: "start" }}>
                  Solicitar
                </button>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: "20px" }}>
            <span className="eyebrow">CONTROL DE CAMBIOS</span>
            <h3 style={{ margin: "4px 0 14px" }}>Solicitudes de ajuste</h3>
            {ajustes.error && <p role="alert">{ajustes.error}</p>}
            {ajustes.datos?.length === 0 && <p>No hay solicitudes registradas.</p>}
            <div style={{ display: "grid", gap: "10px" }}>
              {ajustes.datos?.map((a) => (
                <article
                  key={a.id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "#fff",
                    border: "1px solid #e2ddd3",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <span className={`staff-badge ${a.estado === "APROBADA" ? "staff-stock-ok" : a.estado === "RECHAZADA" ? "staff-stock-bad" : "staff-stock-warn"}`}>
                      {a.estado}
                    </span>
                    <p style={{ margin: "6px 0 0", fontSize: "14px" }}>
                      Producto {a.productoId} · {a.cantidad} · {a.motivo} · {a.estado}
                    </p>
                  </div>
                  {esAdmin && a.estado === "PENDIENTE" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn"
                        disabled={procesando}
                        onClick={() => aprobar(a.id)}
                      >
                        Aprobar
                      </button>
                      <button
                        className="btn secondary"
                        disabled={procesando}
                        onClick={() => {
                          const razon = window.prompt("Motivo del rechazo");
                          if (razon?.trim()) void rechazar(a.id, razon);
                        }}
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MÓDULO: CATÁLOGO Y STOCK */}
      {seccion === "gestion-catalogo" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
          </button>
          <GestionCatalogo
            productos={productos.datos ?? []}
            actualizar={productos.recargar}
          />
        </section>
      )}

      {/* MÓDULO: ENTREGA DIRECTA (ENCARGADO) */}
      {!esAdmin && seccion === "entregas" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio del encargado
          </button>
          <EntregaMeson
            productos={productos.datos ?? []}
            actualizar={productos.recargar}
          />
        </section>
      )}

      {/* MÓDULO: HISTORIAL (ENCARGADO) */}
      {!esAdmin && seccion === "historial" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio del encargado
          </button>
          <HistorialOperativo movimientos={movimientos} />
        </section>
      )}

      {/* MÓDULO: PERSONAS Y ALUMNOS (ADMIN) */}
      {esAdmin && seccion === "personas" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio de administración
          </button>
          <GestionUsuarios />
        </section>
      )}

      {/* MÓDULO: AUDITORÍA Y PARÁMETROS (ADMIN) */}
      {esAdmin && seccion === "auditoria" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio de administración
          </button>
          <Administracion movimientos={movimientos} />
          <div style={{ marginTop: "24px" }}>
            <CorreosSimulados />
          </div>
        </section>
      )}

      {/* MÓDULO: MIS DATOS (TODOS) */}
      {seccion === "correcciones" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
          </button>
          <CorreccionDatos />
        </section>
      )}

      {/* MÓDULO: PRIVACIDAD Y SEGURIDAD (TODOS) */}
      {seccion === "privacidad" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
          </button>
          <Privacidad />
          <div style={{ marginTop: "20px" }}>
            <CambiarClave />
          </div>
        </section>
      )}
    </main>
  );
}
