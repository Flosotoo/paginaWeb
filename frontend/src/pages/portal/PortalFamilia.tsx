import { CambiarClave } from "./CambiarClave";
import { useState } from "react";
import { CancelacionReserva } from "./CancelacionReserva";
import { Privacidad } from "./Privacidad";
import { CorreccionDatos } from "./CorreccionDatos";
import { usePortalFamilia } from "../../hooks/usePortalFamilia";

interface PortalFamiliaProps {
  seccion: string;
  setSeccion: (s: string) => void;
}

const pesos = (valor: number) => `$${valor.toLocaleString("es-CL")}`;

export function PortalFamilia({ seccion, setSeccion }: PortalFamiliaProps) {
  const [busqueda, setBusqueda] = useState("");
  const {
    usuario,
    alumno,
    setAlumno,
    carrito,
    setCarrito,
    monto,
    setMonto,
    tokenPago,
    aviso,
    procesando,
    alumnos,
    productos,
    cuenta,
    movimientos,
    abonos,
    notificaciones,
    avisosReserva,
    reservas,
    reservar,
    iniciarPago,
    confirmarPago,
    cancelar,
  } = usePortalFamilia();

  const alumnoSeleccionado = alumnos.datos?.find((a) => a.id === alumno);

  const productosVisibles = productos.datos?.filter((p) =>
    p.estado === "ACTIVO" &&
    `${p.nombre} ${p.categoria ?? ""}`
      .toLocaleLowerCase("es-CL")
      .includes(busqueda.trim().toLocaleLowerCase("es-CL")),
  );

  const seleccion =
    productos.datos?.filter((p) => (carrito[p.id] ?? 0) > 0) ?? [];

  const totalSeleccion = seleccion.reduce(
    (suma, p) => suma + p.precio * (carrito[p.id] ?? 0),
    0,
  );

  const vistaCuenta = seccion === "inicio" || seccion === "cuenta";

  return (
    <main className="dashboard family-dashboard">
      {aviso && (
        <p role="status" className="form-feedback">
          {aviso}
        </p>
      )}
      {alumnos.error && <p role="alert">{alumnos.error}</p>}

      {vistaCuenta && (
        <>
          <section className="family-intro">
            <div>
              <span className="eyebrow">TU ESPACIO FAMILIAR</span>
              <h1>
                Hola, <span>{usuario?.nombreCompleto}</span>.
              </h1>
              <p>Consulta el saldo disponible de cada estudiante y gestiona sus materiales escolares.</p>
            </div>
            <img
              id="family-original-art"
              src="/assets/img/materiales-escolares.svg"
              alt="Cuadernos y lápices"
              style={{ maxWidth: "240px", maxHeight: "160px" }}
            />
          </section>

          {usuario?.rol === "APODERADO" && (
            <section className="family-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">MIS ALUMNOS</span>
                  <h2>Sus cuentas, en un solo lugar</h2>
                </div>
                <span className="count-pill">{alumnos.datos?.length ?? 0} estudiantes</span>
              </div>

              <div id="children" className="child-grid" aria-label="Seleccionar alumno">
                {alumnos.datos?.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`child-choice ${alumno === a.id ? "is-selected" : ""}`}
                    onClick={() => setAlumno(a.id)}
                    disabled={!!tokenPago || procesando}
                    data-testid={`student-card-${a.id}`}
                  >
                    <div className="child-top">
                      <span className="child-avatar">{a.nombreCompleto.charAt(0)}</span>
                      <span className="choice-state">Cuenta activa</span>
                    </div>
                    <strong>{a.nombreCompleto}</strong>
                    <small>{a.curso} · RUT {a.rut}</small>
                    <div className="choice-bottom">
                      <div>
                        <small>Saldo disponible</small>
                        <br />
                        <b>{cuenta.datos && alumno === a.id ? pesos(cuenta.datos.saldoDisponible) : "Ver cuenta"}</b>
                      </div>
                      <span className="link-like">Seleccionar →</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="account-section">
            <div className="account-top">
              <div>
                <span className="eyebrow">CUENTA SELECCIONADA</span>
                <h2 id="cuenta">Cuenta</h2>
                <p className="muted">
                  {alumnoSeleccionado
                    ? `${alumnoSeleccionado.nombreCompleto} · ${alumnoSeleccionado.curso} · RUT ${alumnoSeleccionado.rut}`
                    : "Detalle de saldos y abonos"}
                </p>
              </div>
              {alumnoSeleccionado?.curso && (
                <span className="selected-tag">{alumnoSeleccionado.curso}</span>
              )}
            </div>

            {cuenta.cargando && <p>Cargando saldo…</p>}
            {cuenta.error && <p role="alert">{cuenta.error}</p>}

            {cuenta.datos && (
              <div className="account-grid">
                <div className="balance-panel">
                  <span>SALDO DISPONIBLE</span>
                  <strong>{pesos(cuenta.datos.saldoDisponible)}</strong>
                  <p>
                    Saldo total en cuenta: {pesos(cuenta.datos.saldoActual)} · Comprometido {pesos(cuenta.datos.saldoComprometido)}
                  </p>
                  <span className="balance-decoration">$</span>
                </div>

                <div className="card" style={{ padding: "20px" }}>
                  {usuario?.rol === "APODERADO" && alumno > 0 && (
                    <>
                      <span className="eyebrow">ABONO DE SALDO</span>
                      <h3 style={{ margin: "5px 0 12px" }}>Pasarela Simulada (Webpay)</h3>
                      <label htmlFor="monto-abono">Monto del abono simulado</label>
                      <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                        <input
                          id="monto-abono"
                          className="input"
                          type="number"
                          min="1"
                          step="1"
                          value={monto}
                          onChange={(e) => setMonto(e.target.value)}
                          disabled={!!tokenPago}
                          style={{ maxWidth: "180px" }}
                        />
                        {!tokenPago ? (
                          <button
                            className="btn"
                            disabled={procesando}
                            onClick={iniciarPago}
                          >
                            Iniciar abono
                          </button>
                        ) : (
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                            <button
                              className="btn"
                              disabled={procesando}
                              onClick={() => confirmarPago("APROBADO")}
                            >
                              Simular aprobación
                            </button>
                            <button
                              className="btn secondary"
                              disabled={procesando}
                              onClick={() => confirmarPago("RECHAZADO")}
                            >
                              Simular rechazo
                            </button>
                          </div>
                        )}
                      </div>
                      <hr style={{ margin: "20px 0 15px", border: "0", borderTop: "1px solid #e8e4da" }} />
                    </>
                  )}
                  <span className="eyebrow">ACCIONES RÁPIDAS</span>
                  <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setSeccion("catalogo")}
                    >
                      🛍 Reservar Materiales →
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => setSeccion("reservas")}
                    >
                      📋 Mis Reservas →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {notificaciones.datos && notificaciones.datos.some((n) => n.alumnoId === alumno && n.estado === "SIMULADA") && (
            <section className="account-section" style={{ marginTop: "20px" }}>
              <span className="eyebrow">ALERTAS</span>
              <h3>Alertas de saldo</h3>
              {notificaciones.datos
                .filter((n) => n.alumnoId === alumno && n.estado === "SIMULADA")
                .map((n) => (
                  <div key={n.id} className="card" style={{ padding: "12px 16px", marginBottom: "8px" }}>
                    <p style={{ margin: 0 }}>{n.contenido}</p>
                  </div>
                ))}
            </section>
          )}
        </>
      )}

      {seccion === "catalogo" && (
        <section className="family-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("cuenta")}
          >
            ← Volver a Mi Cuenta
          </button>
          <div className="section-heading">
            <div>
              <span className="eyebrow">CATÁLOGO Y RESERVAS</span>
              <h2 id="catalogo">Catálogo</h2>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="busqueda-prod">Buscar por nombre o categoría</label>
            <input
              id="busqueda-prod"
              className="input"
              style={{ maxWidth: "420px", marginTop: "6px" }}
              placeholder="Ej: cuaderno, lápiz..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {productos.cargando && <p>Cargando catálogo…</p>}
          {productos.error && <p role="alert">{productos.error}</p>}
          {productosVisibles?.length === 0 && (
            <p>No hay productos para la búsqueda.</p>
          )}

          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {productosVisibles?.map((p) => {
              const disp = p.stockDisponible;
              const enCarrito = carrito[p.id] ?? 0;
              return (
                <article key={p.id} className="product-card" data-testid={`product-card-${p.id}`}>
                  <div style={{ flex: 1 }}>
                    <small>{p.categoria || "Material"} · SKU {p.sku || p.id}</small>
                    <h3>{p.nombre}</h3>
                    <strong>{pesos(p.precio)}</strong>
                    <p className="product-stock">
                      {disp <= 0 ? (
                        <span style={{ color: "#b91c1c", fontWeight: 700 }}>Agotado (0 disp.)</span>
                      ) : disp <= (p.stockCritico || 5) ? (
                        <span style={{ color: "#b45309", fontWeight: 700 }}>⚠ Últimas {disp} unid. disponibles</span>
                      ) : (
                        <span>{disp} disponibles · Stock físico {p.stockFisico}</span>
                      )}
                    </p>
                    {p.descripcion && (
                      <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0" }}>
                        {p.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="product-controls">
                    <label htmlFor={`cant-${p.id}`}>
                      Cantidad de {p.nombre}
                    </label>
                    <input
                      id={`cant-${p.id}`}
                      aria-label={`Cantidad de ${p.nombre}`}
                      className="input"
                      type="number"
                      min="0"
                      max={disp}
                      disabled={disp <= 0}
                      value={enCarrito || ""}
                      placeholder="0"
                      onChange={(e) =>
                        setCarrito({
                          ...carrito,
                          [p.id]: Math.max(
                            0,
                            Math.min(
                              disp,
                              Math.floor(Number(e.target.value)) || 0,
                            ),
                          ),
                        })
                      }
                    />
                    {enCarrito > 0 && (
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                        disabled={procesando}
                        onClick={() => setCarrito({ ...carrito, [p.id]: 0 })}
                      >
                        Quitar {p.nombre}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="card" style={{ marginTop: "24px", padding: "20px", background: "#f5fbf7", border: "2px solid #bcd1b9" }}>
            <span className="eyebrow">RESUMEN DE RESERVA</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginTop: "8px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Total selección: {pesos(totalSeleccion)}</p>
                {seleccion.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    {seleccion.map((p) => (
                      <p key={p.id} style={{ margin: "4px 0", fontSize: "13px" }}>
                        Selección: {p.nombre} · {carrito[p.id]} x {pesos(p.precio)} ={" "}
                        {pesos(p.precio * (carrito[p.id] ?? 0))}{" "}
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ fontSize: "10px", padding: "2px 6px", marginLeft: "6px" }}
                          disabled={procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: 0 })}
                        >
                          Quitar {p.nombre}
                        </button>
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="btn btn-wide"
                style={{ maxWidth: "260px" }}
                disabled={procesando || !alumno || totalSeleccion <= 0}
                onClick={reservar}
              >
                {procesando ? "Procesando…" : "Confirmar reserva"}
              </button>
            </div>
          </div>
        </section>
      )}

      {seccion === "reservas" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("cuenta")}
          >
            ← Volver a Mi Cuenta
          </button>
          <div className="section-heading">
            <div>
              <span className="eyebrow">HISTORIAL</span>
              <h2 id="reservas">Mis reservas</h2>
            </div>
          </div>

          {reservas.error && <p role="alert">{reservas.error}</p>}
          {reservas.datos?.length === 0 && <p>No hay reservas.</p>}

          <div style={{ display: "grid", gap: "14px" }}>
            {reservas.datos?.map((r) => (
              <article key={r.id} className="card" style={{ padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <span className={`staff-badge ${r.estado === "ENTREGADA" ? "staff-stock-ok" : r.estado === "CANCELADA" ? "staff-stock-bad" : "staff-stock-warn"}`}>
                      {r.estado}
                    </span>
                    <h3 style={{ margin: "6px 0 2px" }}>
                      {r.codigo} · {r.estado}
                    </h3>
                    <p style={{ margin: "4px 0", color: "var(--muted)", fontSize: "14px" }}>
                      {pesos(r.total)} ·{" "}
                      {r.items
                        .map((i) => `${i.nombreProducto} (${i.cantidad})`)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                {r.estado === "PENDIENTE" && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid #e8e4da", paddingTop: "10px" }}>
                    <CancelacionReserva procesando={procesando} cancelar={(motivo) => cancelar(r.id, motivo)} />
                  </div>
                )}
              </article>
            ))}
          </div>

          <div style={{ marginTop: "30px" }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">COMUNICACIONES</span>
                <h2>Confirmaciones de reserva</h2>
              </div>
            </div>
            <p>Los correos son simulados; aquí puedes consultar los avisos registrados.</p>
            <button
              className="btn secondary"
              style={{ marginBottom: "12px" }}
              onClick={() => void avisosReserva.recargar()}
            >
              Actualizar avisos
            </button>
            {avisosReserva.error && <p role="alert">{avisosReserva.error}</p>}
            <div style={{ display: "grid", gap: "12px" }}>
              {avisosReserva.datos
                ?.filter((a) => a.alumnoId === alumno && a.tipoEvento === "RESERVA")
                .filter((a, i, todos) => todos.findIndex((otro) => otro.reservaId === a.reservaId) === i)
                .map((a) => (
                  <article key={a.id} className="card" style={{ padding: "16px", background: "#f0fdf4", border: "1px solid #86efac" }}>
                    <span className="staff-badge staff-stock-ok">AVISO SIMULADO</span>
                    <h3 style={{ margin: "6px 0" }}>{a.asunto}</h3>
                    <p style={{ whiteSpace: "pre-line", margin: "6px 0" }}>{a.mensaje}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                      {a.estado === "SIMULADA" ? "Correo simulado" : `Estado del aviso: ${a.estado}`}
                    </p>
                  </article>
                ))}
            </div>
          </div>
        </section>
      )}

      {seccion === "movimientos" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("cuenta")}
          >
            ← Volver a Mi Cuenta
          </button>
          <div className="section-heading">
            <div>
              <span className="eyebrow">FINANZAS</span>
              <h2>Historial de abonos</h2>
            </div>
          </div>
          {abonos.error && <p role="alert">{abonos.error}</p>}
          {abonos.datos?.length === 0 && <p>No hay abonos.</p>}
          <div style={{ display: "grid", gap: "8px", marginBottom: "30px" }}>
            {abonos.datos?.map((a) => (
              <div key={a.id} className="card" style={{ padding: "12px 16px" }}>
                <strong>{pesos(a.monto)}</strong> · {a.medioPago} ·{" "}
                <span className={`staff-badge ${a.estado === "CONFIRMADO" ? "staff-stock-ok" : "staff-stock-warn"}`}>
                  {a.estado}
                </span>{" "}
                · {new Date(a.fechaCreacion).toLocaleString("es-CL")}
              </div>
            ))}
          </div>

          <div className="section-heading">
            <div>
              <span className="eyebrow">CARTOLA</span>
              <h2>Movimientos</h2>
            </div>
          </div>
          {movimientos.error && <p role="alert">{movimientos.error}</p>}
          {movimientos.datos?.length === 0 && <p>No hay movimientos.</p>}
          <div style={{ display: "grid", gap: "8px" }}>
            {movimientos.datos?.map((m) => (
              <div key={m.id} className="card" style={{ padding: "12px 16px" }}>
                <span className="staff-badge">{m.tipo}</span>{" "}
                <strong>{pesos(m.monto)}</strong> · Saldo {pesos(m.saldoResultante)} · {m.descripcion}
              </div>
            ))}
          </div>
        </section>
      )}

      {seccion === "correcciones" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("cuenta")}
          >
            ← Volver a Mi Cuenta
          </button>
          <CorreccionDatos />
        </section>
      )}

      {seccion === "privacidad" && (
        <section className="account-section">
          <button
            type="button"
            className="staff-small"
            onClick={() => setSeccion("cuenta")}
          >
            ← Volver a Mi Cuenta
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
