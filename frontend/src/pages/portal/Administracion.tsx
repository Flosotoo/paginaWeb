import { exportarCsv } from "../../utils/exportarCsv";
import { useState } from "react";
import { useAdministracion } from "../../hooks/useAdministracion";
import { useSesion } from "../../context/SesionContext";
import type { ConsultaMovimientos } from "../../hooks/usePortalInterno";
export function Administracion({ movimientos }: { movimientos: ConsultaMovimientos }) {
  const a = useAdministracion();
  const { usuario } = useSesion();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Sub-navegación modular
  const [subseccion, setSubseccion] = useState<string>("todas");

  // Filtros y paginación para Auditoría
  const [busquedaAuditoria, setBusquedaAuditoria] = useState<string>("");
  const [paginaAuditoria, setPaginaAuditoria] = useState<number>(1);

  // Paginación para Abonos
  const [paginaAbonos, setPaginaAbonos] = useState<number>(1);

  const abonosVisibles = a.abonos.datos?.filter((b) => {
    if (!a.reporte) return true;
    const fecha = b.fechaCreacion.slice(0, 10);
    return fecha >= a.reporte.desde && fecha <= a.reporte.hasta;
  });

  const TAMANO_PAGINA_ABONOS = 10;
  const totalPaginasAbonos = Math.max(1, Math.ceil((abonosVisibles?.length ?? 0) / TAMANO_PAGINA_ABONOS));
  const abonosPaginados = (abonosVisibles ?? []).slice(
    (paginaAbonos - 1) * TAMANO_PAGINA_ABONOS,
    paginaAbonos * TAMANO_PAGINA_ABONOS,
  );

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
          <span className="eyebrow">CONTROL GLOBAL</span>
          <h2 id="administracion">Administración</h2>
        </div>
      </div>

      {a.aviso && <p role="status" className="form-feedback" style={{ marginBottom: "16px" }}>{a.aviso}</p>}

      {/* Barra de sub-navegación modular */}
      <div className="subnav-cards" style={{ marginBottom: "22px" }}>
        {[
          ["todas", "Vista completa", "Todos los parámetros, finanzas y auditoría"],
          ["identidad", "1. Datos y Políticas", "Identidad institucional, logo y seguridad"],
          ["finanzas", "2. Finanzas y Webpay", "Reportes por período, cartolas y abonos"],
          ["auditoria", "3. Auditoría y Cierres", "Eventos del sistema, ajustes y devoluciones"],
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

      {(subseccion === "todas" || subseccion === "finanzas") && (
        <div className="card">
          <span className="eyebrow">LIBRO MAYOR Y REPORTES</span>
          <h3>Resumen por período</h3>
          <p className="card-desc">Filtra transacciones por rango de fechas para conciliar abonos y cartola institucional.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void a.consultarResumen(desde, hasta);
            }}
          >
            <div className="form-grid-2" style={{ maxWidth: "520px" }}>
              <label>
                Desde
                <input
                  className="input"
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  required
                />
              </label>
              <label>
                Hasta
                <input
                  className="input"
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="btn" disabled={a.procesando}>
                Consultar resumen
              </button>
            </div>
          </form>

          {a.resumen && (
            <div style={{ marginTop: "20px", padding: "16px", background: "#fbf9f5", border: "1px solid #e9e3d8", borderRadius: "14px" }}>
              <span className="eyebrow">TOTALES DEL PERÍODO</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "10px" }}>
                {Object.entries(a.resumen).map(([clave, valor]) => (
                  <div key={clave} style={{ background: "#fff", padding: "12px 14px", borderRadius: "10px", border: "1px solid #ede7dc" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", display: "block" }}>{clave}</span>
                    <strong style={{ fontSize: "18px", color: "#173b31" }}>${valor.toLocaleString("es-CL")}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {a.reporte && (
            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px" }}>Movimientos y saldos por alumno</h4>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
                    Período: {a.reporte.desde} a {a.reporte.hasta}. Los saldos son actuales.
                  </p>
                </div>
                <button
                  className="btn secondary"
                  onClick={() => {
                    const reporte = a.reporte!;
                    exportarCsv(
                      "cuentas.csv",
                      [
                        "Establecimiento",
                        "Desde",
                        "Hasta",
                        "Alumno",
                        "Nombre",
                        "Saldo actual CLP",
                        "Saldo comprometido CLP",
                        "Saldo disponible CLP",
                        "Fecha movimiento",
                        "Tipo",
                        "Monto CLP",
                        "Descripción",
                      ],
                      reporte.cuentas.flatMap(({ cuenta, movimientos }) =>
                        (movimientos.length ? movimientos : [null]).map((m) => [
                          cuenta.idEstablecimiento,
                          reporte.desde,
                          reporte.hasta,
                          cuenta.alumnoId,
                          reporte.nombres[cuenta.alumnoId] ?? "",
                          cuenta.saldoActual,
                          cuenta.saldoComprometido,
                          cuenta.saldoDisponible,
                          m?.fecha ?? "",
                          m?.tipo ?? "",
                          m?.monto ?? "",
                          m?.descripcion ?? "",
                        ]),
                      ),
                    );
                  }}
                >
                  Exportar cuentas CSV
                </button>
              </div>

              {a.reporte.cuentas.length === 0 && (
                <p style={{ marginTop: "12px" }}>No hay cuentas registradas.</p>
              )}

              <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
                {a.reporte.cuentas.map(({ cuenta, movimientos }) => (
                  <article
                    key={cuenta.alumnoId}
                    style={{
                      padding: "12px 16px",
                      background: "#fff",
                      border: "1px solid #eee8df",
                      borderRadius: "12px",
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#173b31" }}>
                      Alumno {a.reporte!.nombres[cuenta.alumnoId] ?? cuenta.alumnoId} · Actual: ${cuenta.saldoActual.toLocaleString("es-CL")} · Comprometido: ${cuenta.saldoComprometido.toLocaleString("es-CL")} · Disponible: ${cuenta.saldoDisponible.toLocaleString("es-CL")}
                    </p>
                    {movimientos.length === 0 ? (
                      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>Sin movimientos en el período.</p>
                    ) : (
                      <ul style={{ margin: "6px 0 0", paddingLeft: "20px", fontSize: "0.85rem", color: "#4f5b55" }}>
                        {movimientos.map((m) => (
                          <li key={m.id}>
                            {m.fecha} · <span className="pill-state">{m.tipo}</span> · ${m.monto.toLocaleString("es-CL")} · {m.descripcion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span className="eyebrow">CONCILIACIÓN WEBPAY</span>
                <h3 style={{ margin: "2px 0 4px" }}>Abonos registrados</h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
                  {a.reporte
                    ? `Período filtrado: ${a.reporte.desde} a ${a.reporte.hasta}.`
                    : "Consulta un período para filtrar y exportar."}
                </p>
              </div>
              <button
                className="btn"
                disabled={!a.reporte}
                onClick={() =>
                  exportarCsv(
                    "abonos.csv",
                    [
                      "Alumno",
                      "Apoderado",
                      "Monto CLP",
                      "Medio",
                      "Estado",
                      "Fecha",
                      "Establecimiento",
                      "Desde",
                      "Hasta",
                    ],
                    abonosVisibles?.map((b) => [
                      b.alumnoId,
                      b.apoderadoId,
                      b.monto,
                      b.medioPago,
                      b.estado,
                      b.fechaCreacion,
                      b.idEstablecimiento,
                      a.reporte!.desde,
                      a.reporte!.hasta,
                    ]) ?? [],
                  )
                }
              >
                Exportar abonos CSV
              </button>
            </div>

            {a.abonos.error && <p role="alert">{a.abonos.error}</p>}
            {abonosVisibles && abonosVisibles.length === 0 && (
              <p style={{ marginTop: "12px" }}>No hay abonos para el período.</p>
            )}

            {abonosVisibles && abonosVisibles.length > 0 && (
              <>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>Monto</th>
                        <th>Medio</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abonosPaginados.map((b) => (
                        <tr key={b.id}>
                          <td>Alumno {b.alumnoId}</td>
                          <td><strong>${b.monto.toLocaleString("es-CL")}</strong></td>
                          <td><span className="pill-state neutral">{b.medioPago}</span></td>
                          <td>
                            <span className={`pill-state ${b.estado === "APROBADO" ? "" : "bad"}`}>
                              {b.estado}
                            </span>
                          </td>
                          <td>{new Date(b.fechaCreacion).toLocaleString("es-CL")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPaginasAbonos > 1 && (
                  <div className="pagination-bar">
                    <span>
                      Página {paginaAbonos} de {totalPaginasAbonos} ({abonosVisibles.length} abonos)
                    </span>
                    <div className="pagination-controls">
                      <button
                        type="button"
                        disabled={paginaAbonos <= 1}
                        onClick={() => setPaginaAbonos((p) => Math.max(1, p - 1))}
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        disabled={paginaAbonos >= totalPaginasAbonos}
                        onClick={() => setPaginaAbonos((p) => Math.min(totalPaginasAbonos, p + 1))}
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
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
