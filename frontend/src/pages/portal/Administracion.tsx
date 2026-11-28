import { useState } from "react";
import { useAdministracion } from "../../hooks/useAdministracion";
import { useSesion } from "../../context/SesionContext";
import type { ConsultaMovimientos } from "../../hooks/usePortalInterno";

export function Administracion({
  movimientos,
  subseccionInicial = "todas",
}: {
  movimientos: ConsultaMovimientos;
  subseccionInicial?: "todas" | "identidad" | "auditoria";
}) {
  const a = useAdministracion();
  const { usuario } = useSesion();

  // Sub-navegación modular (los reportes financieros y pagos Webpay viven en Cuenta Librería y Pagos).
  const [subseccion, setSubseccion] = useState<string>(subseccionInicial);

  // Filtros y paginación para Auditoría
  const [busquedaAuditoria, setBusquedaAuditoria] = useState<string>("");
  const [paginaAuditoria, setPaginaAuditoria] = useState<number>(1);

  const eventosAuditoriaFiltrados = (a.auditoria.datos ?? []).filter((r) => {
    if (!busquedaAuditoria.trim()) return true;
    const q = busquedaAuditoria.trim().toLowerCase();
    return (
      r.accion.toLowerCase().includes(q) ||
      r.entidad.toLowerCase().includes(q) ||
      (r.detalle && r.detalle.toLowerCase().includes(q)) ||
      String(r.usuarioId ?? "").includes(q)
    );
  });

  const TAMANO_PAGINA_AUDITORIA = 10;
  const totalPaginasAuditoria = Math.max(1, Math.ceil(eventosAuditoriaFiltrados.length / TAMANO_PAGINA_AUDITORIA));
  const eventosAuditoriaPaginados = eventosAuditoriaFiltrados.slice(
    (paginaAuditoria - 1) * TAMANO_PAGINA_AUDITORIA,
    paginaAuditoria * TAMANO_PAGINA_AUDITORIA,
  );
  return (
    <section className="account-section">
      <div className="section-heading" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">CONTROL INSTITUCIONAL</span>
          <h2 id="administracion">Configuración y auditoría</h2>
        </div>
      </div>

      {a.aviso && <p role="status" className="form-feedback" style={{ marginBottom: "16px" }}>{a.aviso}</p>}

      {/* Barra de sub-navegación modular */}
      <div className="subnav-cards" style={{ marginBottom: "22px" }}>
        {[
          ["todas", "Vista completa", "Parámetros del colegio, políticas y bitácora"],
          ["identidad", "Datos y Políticas", "Identidad institucional, logo y seguridad"],
          ["auditoria", "Auditoría y Cierres", "Eventos del sistema, ajustes y devoluciones"],
        ].map(([id, titulo, desc]) => (
          <button
            key={id}
            type="button"
            className={`subnav-card ${subseccion === id ? "active" : ""}`}
            onClick={() => setSubseccion(id)}
          >
            <strong>{titulo}</strong>
            <span>{desc}</span>
          </button>
        ))}
      </div>

      {(subseccion === "todas" || subseccion === "identidad") && (
        <>
          <div className="card">
            <span className="eyebrow">CONFIGURACIÓN DEL COLEGIO</span>
            <h3>Configuración institucional</h3>
            <p className="card-desc">Parámetros del establecimiento escolar, datos de contacto e identidad de librería.</p>
            {a.configuracion.error && <p role="alert">{a.configuracion.error}</p>}
            {a.config && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void a.guardarConfig();
                }}
              >
                <div className="form-grid-2">
                  <label>
                    Establecimiento
                    <input
                      className="input"
                      value={a.config.nombreEstablecimiento}
                      onChange={(e) =>
                        a.setConfig({
                          ...a.config!,
                          nombreEstablecimiento: e.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Nombre de librería
                    <input
                      className="input"
                      value={a.config.nombreLibreria}
                      onChange={(e) =>
                        a.setConfig({ ...a.config!, nombreLibreria: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>
                <div className="form-grid-2">
                  <label>
                    Correo de contacto
                    <input
                      className="input"
                      type="email"
                      value={a.config.correoContacto ?? ""}
                      onChange={(e) =>
                        a.setConfig({ ...a.config!, correoContacto: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Ruta o URL del logo
                    <input
                      className="input"
                      maxLength={255}
                      value={a.config.logoUrl ?? ""}
                      onChange={(e) => a.setConfig({ ...a.config!, logoUrl: e.target.value })}
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button className="btn" disabled={a.procesando}>
                    Guardar configuración
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="card">
            <span className="eyebrow">POLÍTICAS Y SEGURIDAD</span>
            <h3>Política de acceso</h3>
            <p className="card-desc">La edad mínima de acceso autónomo es de 12 años. Configura los límites de seguridad de inicio de sesión y alertas de saldo.</p>
            {a.politica.error && <p role="alert">{a.politica.error}</p>}
            {a.reglas && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void a.guardarReglas();
                }}
              >
                <div className="form-grid-3">
                  <label>
                    Máximo de intentos
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="1"
                      value={a.reglas.maxIntentosFallidos}
                      onChange={(e) =>
                        a.setReglas({
                          ...a.reglas!,
                          maxIntentosFallidos: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Minutos de bloqueo
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="1"
                      value={a.reglas.minutosBloqueo}
                      onChange={(e) =>
                        a.setReglas({
                          ...a.reglas!,
                          minutosBloqueo: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Umbral saldo bajo CLP
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="1"
                      value={a.reglas.umbralSaldoBajoClp}
                      onChange={(e) =>
                        a.setReglas({
                          ...a.reglas!,
                          umbralSaldoBajoClp: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button className="btn" disabled={a.procesando}>
                    Guardar política
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {(subseccion === "todas" || subseccion === "auditoria") && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
            <div>
              <span className="eyebrow">AUDITORÍA CENTRAL</span>
              <h3 style={{ margin: "2px 0 4px" }}>Auditoría</h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
                Los eventos se consultan desde los servicios responsables de cada operación.
              </p>
            </div>
            <button
              className="btn secondary"
              onClick={() =>
                void Promise.all([
                  a.auditoria.recargar(),
                  a.constancias.recargar(),
                  movimientos.recargar(),
                ])
              }
            >
              Actualizar auditoría
            </button>
          </div>

          {/* Buscador de eventos de auditoría */}
          <div style={{ display: "flex", gap: "10px", margin: "14px 0", flexWrap: "wrap", alignItems: "center" }}>
            <input
              className="input"
              placeholder="Buscar por acción, detalle o entidad..."
              value={busquedaAuditoria}
              onChange={(e) => {
                setBusquedaAuditoria(e.target.value);
                setPaginaAuditoria(1);
              }}
              style={{ maxWidth: "340px", fontSize: "0.88rem" }}
            />
            <span className="pill-state neutral">{eventosAuditoriaFiltrados.length} eventos registrados</span>
          </div>

          {a.auditoria.error && <p role="alert">{a.auditoria.error}</p>}

          <div className="audit-feed">
            {eventosAuditoriaPaginados.map((r) => (
              <div key={r.id} className="audit-card">
                <div className="audit-card-top">
                  <span className="pill-state">{r.accion}</span>
                  <span>{r.fechaHora}</span>
                  <span>Usuario: {r.usuarioId ?? "no informado"}</span>
                  <span>Establecimiento: {usuario?.idEstablecimiento}</span>
                  <span>{r.entidad} #{r.entidadId}</span>
                </div>
                <strong>{r.detalle}</strong>
              </div>
            ))}
          </div>

          {totalPaginasAuditoria > 1 && (
            <div className="pagination-bar">
              <span>
                Página {paginaAuditoria} de {totalPaginasAuditoria} ({eventosAuditoriaFiltrados.length} eventos)
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  disabled={paginaAuditoria <= 1}
                  onClick={() => setPaginaAuditoria((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaAuditoria >= totalPaginasAuditoria}
                  onClick={() => setPaginaAuditoria((p) => Math.min(totalPaginasAuditoria, p + 1))}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: "24px", borderTop: "1px solid #eee8df", paddingTop: "18px" }}>
            <span className="eyebrow">CONTROL DE EXISTENCIAS</span>
            <h4 style={{ margin: "4px 0 10px" }}>Ajustes de inventario aprobados</h4>
            {movimientos.error && <p role="alert">{movimientos.error}</p>}
            {movimientos.datos?.filter((m) => m.tipo === "AJUSTE").length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>No hay ajustes registrados.</p>
            )}
            <div style={{ display: "grid", gap: "8px" }}>
              {movimientos.datos?.filter((m) => m.tipo === "AJUSTE").map((m) => (
                <div key={m.id} className="audit-card">
                  <div className="audit-card-top">
                    <span className="pill-state warn">AJUSTE</span>
                    <span>{m.fecha}</span>
                  </div>
                  <strong>
                    {m.fecha} · administrador {m.responsableId ?? "no informado"} · establecimiento {usuario?.idEstablecimiento} · {m.nombreProducto} · ajuste {m.variacionFisica}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "24px", borderTop: "1px solid #eee8df", paddingTop: "18px" }}>
            <span className="eyebrow">CIERRES DE CUENTA</span>
            <h4 style={{ margin: "4px 0 10px" }}>Constancias de devolución de saldo</h4>
            {a.constancias.error && <p role="alert">{a.constancias.error}</p>}
            {a.constancias.datos?.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>No hay constancias registradas.</p>
            )}
            <div style={{ display: "grid", gap: "8px" }}>
              {a.constancias.datos?.map((c) => (
                <div key={c.id} className="audit-card">
                  <div className="audit-card-top">
                    <span className="pill-state bad">DEVOLUCIÓN</span>
                    <span>{c.fecha}</span>
                  </div>
                  <strong>
                    {c.fecha} · administrador {c.administradorId} · alumno {c.alumnoId} · ${c.montoClp.toLocaleString("es-CL")} · establecimiento {usuario?.idEstablecimiento}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
