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
  const [categoriaSel, setCategoriaSel] = useState("Todos");
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

  const categoriasDisponibles = [
    "Todos",
    ...Array.from(
      new Set(
        (productos.datos ?? [])
          .map((p) => p.categoria)
          .filter((c): c is string => Boolean(c)),
      ),
    ),
  ];

  const productosVisibles = productos.datos?.filter((p) => {
    if (p.estado !== "ACTIVO") return false;
    if (categoriaSel !== "Todos" && p.categoria !== categoriaSel) return false;
    return `${p.nombre} ${p.categoria ?? ""} ${p.sku ?? ""}`
      .toLocaleLowerCase("es-CL")
      .includes(busqueda.trim().toLocaleLowerCase("es-CL"));
  });

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
        <div
          role="status"
          className={`form-feedback ${
            aviso.toLowerCase().includes("error") ||
            aviso.toLowerCase().includes("rechazad") ||
            aviso.toLowerCase().includes("no se pudo")
              ? "error"
              : ""
          }`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            borderRadius: "12px",
            marginBottom: "16px",
            background:
              aviso.toLowerCase().includes("error") ||
              aviso.toLowerCase().includes("rechazad") ||
              aviso.toLowerCase().includes("no se pudo")
                ? "#fef3f2"
                : "#eef6f0",
            border: `1px solid ${
              aviso.toLowerCase().includes("error") ||
              aviso.toLowerCase().includes("rechazad") ||
              aviso.toLowerCase().includes("no se pudo")
                ? "#fecdca"
                : "#bcdfc6"
            }`,
            color:
              aviso.toLowerCase().includes("error") ||
              aviso.toLowerCase().includes("rechazad") ||
              aviso.toLowerCase().includes("no se pudo")
                ? "#b42318"
                : "#18543c",
            fontWeight: 600,
            fontSize: "0.92rem",
          }}
        >
          <span>
            {aviso.toLowerCase().includes("error") ||
            aviso.toLowerCase().includes("rechazad") ||
            aviso.toLowerCase().includes("no se pudo")
              ? "⚠️"
              : "✓"}
          </span>
          <span>{aviso}</span>
        </div>
      )}
      {alumnos.error && <p role="alert">{alumnos.error}</p>}

      {vistaCuenta && (
        <>
          <section className="family-intro">
            <div>
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
                  <h2>Mis alumnos</h2>
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
                      <span className="choice-state">{alumno === a.id ? "✓ Cuenta activa" : "Activa"}</span>
                    </div>
                    <strong>{a.nombreCompleto}</strong>
                    <small>{a.curso} · RUT {a.rut}</small>
                    <div className="choice-bottom">
                      <span className="link-like">{alumno === a.id ? "Seleccionado" : "Seleccionar →"}</span>
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
                  <p style={{ margin: "6px 0 2px" }}>
                    Saldo total en cuenta: {pesos(cuenta.datos.saldoActual)}
                  </p>
                  <p style={{ margin: "2px 0 0", color: "#f3eee7" }}>
                    Comprometido {pesos(cuenta.datos.saldoComprometido)}
                  </p>
                  <span className="balance-decoration">$</span>
                </div>

                <div className="card" style={{ padding: "20px" }}>
                  {usuario?.rol === "APODERADO" && alumno > 0 && (() => {
                    const MIN_ABONO = 100;
                    const MAX_ABONO = 500000;
                    const montoNum = Number(monto);
                    const errorMontoAbono =
                      monto !== "" && (!Number.isSafeInteger(montoNum) || montoNum < MIN_ABONO
                        ? `El monto mínimo para abonar es $${MIN_ABONO.toLocaleString("es-CL")} CLP.`
                        : montoNum > MAX_ABONO
                        ? `El monto máximo permitido por abono es $${MAX_ABONO.toLocaleString("es-CL")} CLP.`
                        : null);

                    return (
                      <>
                        <span className="eyebrow">ABONO DE SALDO</span>
                        <h3 style={{ margin: "5px 0 12px" }}>Pasarela Simulada (Webpay)</h3>
                        <label htmlFor="monto-abono">Monto del abono simulado</label>
                        <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", alignItems: "flex-start" }}>
                          <div>
                            <input
                              id="monto-abono"
                              className="input"
                              type="number"
                              min={MIN_ABONO}
                              max={MAX_ABONO}
                              step="1"
                              placeholder="Ej: 10000"
                              value={monto}
                              onChange={(e) => setMonto(e.target.value)}
                              disabled={!!tokenPago}
                              style={{
                                maxWidth: "180px",
                                borderColor: errorMontoAbono ? "#b42318" : undefined,
                              }}
                            />
                            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--muted)" }}>
                              Mínimo ${MIN_ABONO.toLocaleString("es-CL")} · Máximo ${MAX_ABONO.toLocaleString("es-CL")} CLP
                            </p>
                          </div>
                          {!tokenPago ? (
                            <button
                              className="btn"
                              disabled={procesando || Boolean(errorMontoAbono) || !monto}
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

                        {errorMontoAbono && (
                          <p
                            role="alert"
                            style={{
                              margin: "8px 0 0",
                              color: "#b42318",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span>⚠️</span> {errorMontoAbono}
                          </p>
                        )}

                        {tokenPago && (
                          <div
                            style={{
                              marginTop: "12px",
                              padding: "10px 14px",
                              background: "#eef6f0",
                              border: "1px solid #bcdfc6",
                              borderRadius: "10px",
                              fontSize: "0.86rem",
                              color: "#18543c",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontWeight: 600,
                            }}
                          >
                            <span>💳</span>
                            <span>Transacción Webpay iniciada ({tokenPago.slice(0, 8)}...). Simula el resultado para acreditar.</span>
                          </div>
                        )}
                        <hr style={{ margin: "20px 0 15px", border: "0", borderTop: "1px solid #e8e4da" }} />
                      </>
                    );
                  })()}
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

          {/* Últimos movimientos del alumno en portada */}
          <section className="family-activity" style={{ marginTop: "24px" }}>
            <div className="section-heading">
              <div>
                <h2>Últimos movimientos</h2>
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setSeccion("movimientos")}
                style={{ fontSize: "13px" }}
              >
                Ver cartola completa →
              </button>
            </div>
            {movimientos.cargando && <p>Cargando movimientos…</p>}
            {movimientos.error && <p role="alert">{movimientos.error}</p>}
            {movimientos.datos && movimientos.datos.length > 0 ? (
              <div className="family-movement-list" style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                {movimientos.datos.slice(0, 5).map((m) => {
                  const esIngreso = m.tipo === "ABONO" || m.tipo === "DEVOLUCION" || m.tipo === "LIBERACION_RESERVA";
                  return (
                    <div
                      key={m.id}
                      className="family-movement"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 16px",
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2ddd3",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span
                          className={`movement-icon ${esIngreso ? "credit" : "debit"}`}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: "bold",
                            background: esIngreso ? "#dcebdc" : "#f4dfd2",
                            color: esIngreso ? "#1b6238" : "#993a20",
                            fontSize: "14px",
                          }}
                        >
                          {esIngreso ? "+$" : "-$"}
                        </span>
                        <div>
                          <strong style={{ fontSize: "14px", color: "#173b31" }}>
                            {m.descripcion || m.tipo}
                          </strong>
                          <br />
                          <small className="muted" style={{ fontSize: "12px" }}>
                            {new Date(m.fecha).toLocaleDateString("es-CL")}
                          </small>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ color: esIngreso ? "#1b6238" : "#242b28", fontSize: "15px" }}>
                          {esIngreso ? "+" : "-"}{pesos(m.monto)}
                        </strong>
                        <br />
                        <small className="muted" style={{ fontSize: "12px" }}>
                          Saldo {pesos(m.saldoResultante)}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !movimientos.cargando && (
                <p className="muted" style={{ marginTop: "10px" }}>
                  No hay movimientos registrados para esta cuenta.
                </p>
              )
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
          {/* Franja compacta del alumno con saldo */}
          <div
            className="reserva-student-strip"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f4eee3",
              border: "1px solid #ddd5c7",
              padding: "14px 20px",
              borderRadius: "16px",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <small style={{ textTransform: "uppercase", fontWeight: 700, color: "#65756c", fontSize: "11px", letterSpacing: "0.5px" }}>
                Alumno seleccionado
              </small>
              <h3 style={{ margin: "2px 0 0", color: "#173b31", fontSize: "1.15rem" }}>
                {alumnoSeleccionado?.nombreCompleto || "Estudiante"} {alumnoSeleccionado?.curso ? `· ${alumnoSeleccionado.curso}` : ""}
              </h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <small style={{ textTransform: "uppercase", fontWeight: 700, color: "#65756c", fontSize: "11px", letterSpacing: "0.5px" }}>
                Saldo disponible para reservas
              </small>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#18543c" }}>
                {pesos(cuenta.datos?.saldoDisponible ?? 0)}
              </div>
            </div>
          </div>

          <div className="section-heading" style={{ marginBottom: "14px" }}>
            <div>
              <h2 id="catalogo">Catálogo de materiales</h2>
            </div>
          </div>

          {/* Buscador y Filtros por Categoría */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="busqueda-prod">Buscar por nombre o categoría</label>
            <input
              id="busqueda-prod"
              className="input"
              style={{ maxWidth: "460px", marginTop: "6px" }}
              placeholder="Ej: cuaderno, lápiz, regla..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {categoriasDisponibles.length > 1 && (
            <div className="category-list" aria-label="Filtrar por categoría">
              {categoriasDisponibles.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-chip ${categoriaSel === cat ? "active" : ""}`}
                  onClick={() => setCategoriaSel(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {productos.cargando && <p>Cargando catálogo…</p>}
          {productos.error && <p role="alert">{productos.error}</p>}
          {productosVisibles?.length === 0 && (
            <p>No hay productos para la búsqueda.</p>
          )}

          {/* Grilla / Lista con Resumen a la derecha */}
          <div className="reserva-layout">
            <div className="product-list">
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
                    <div className="product-controls" style={{ minWidth: "165px", minHeight: "82px", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-end" }}>
                      <label htmlFor={`cant-${p.id}`} style={{ fontSize: "12px", marginBottom: "4px", textAlign: "right", width: "100%" }}>
                        Cantidad de {p.nombre}
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ width: "32px", minHeight: "36px", padding: 0, fontSize: "16px", fontWeight: "bold" }}
                          disabled={enCarrito <= 0 || procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: Math.max(0, enCarrito - 1) })}
                          aria-label={`Disminuir ${p.nombre}`}
                        >
                          -
                        </button>
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
                          style={{ width: "70px", textAlign: "center", padding: "6px 8px" }}
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
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ width: "32px", minHeight: "36px", padding: 0, fontSize: "16px", fontWeight: "bold" }}
                          disabled={enCarrito >= disp || disp <= 0 || procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: Math.min(disp, enCarrito + 1) })}
                          aria-label={`Aumentar ${p.nombre}`}
                        >
                          +
                        </button>
                      </div>
                      <div style={{ minHeight: "22px", marginTop: "4px", textAlign: "right", width: "100%" }}>
                        <button
                          type="button"
                          style={{
                            visibility: enCarrito > 0 ? "visible" : "hidden",
                            background: "none",
                            border: "none",
                            color: "#b91c1c",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: 0,
                            fontWeight: 600,
                          }}
                          disabled={procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: 0 })}
                        >
                          Quitar del pedido
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Columna Derecha Fija: Mi Reserva */}
            <aside className="reserva-aside">
              <span className="eyebrow">MI PEDIDO</span>
              <h3 style={{ margin: "4px 0 14px", fontSize: "1.45rem", color: "#173b31" }}>Mi reserva</h3>
              {seleccion.length === 0 ? (
                <p className="muted" style={{ fontSize: "13px", margin: "10px 0 16px" }}>
                  Aún no has agregado materiales. Ajusta las cantidades en la lista para armar tu pedido.
                </p>
              ) : (
                <div style={{ marginBottom: "16px", maxHeight: "320px", overflowY: "auto" }}>
                  {seleccion.map((p) => (
                    <div key={p.id} className="cart-line" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "8px 0", borderBottom: "1px solid #e8e4da" }}>
                      <div style={{ flex: 1 }}>
                        <strong>{p.nombre}</strong>
                        <small style={{ display: "block", color: "var(--muted)", fontSize: "12px" }}>
                          {pesos(p.precio)} c/u · Total: {pesos(p.precio * (carrito[p.id] ?? 0))}
                        </small>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ width: "26px", minHeight: "26px", padding: 0, borderRadius: "6px", fontSize: "14px", fontWeight: "bold" }}
                          aria-label={`Disminuir ${p.nombre}`}
                          disabled={procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: Math.max(0, (carrito[p.id] ?? 1) - 1) })}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 800, minWidth: "22px", textAlign: "center", fontSize: "13px" }}>
                          {carrito[p.id]}
                        </span>
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ width: "26px", minHeight: "26px", padding: 0, borderRadius: "6px", fontSize: "14px", fontWeight: "bold" }}
                          aria-label={`Aumentar ${p.nombre}`}
                          disabled={(carrito[p.id] ?? 0) >= p.stockDisponible || procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: Math.min(p.stockDisponible, (carrito[p.id] ?? 0) + 1) })}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          style={{ background: "none", border: "none", color: "#b91c1c", fontSize: "18px", cursor: "pointer", marginLeft: "4px", lineHeight: 1 }}
                          aria-label={`Quitar ${p.nombre}`}
                          onClick={() => setCarrito({ ...carrito, [p.id]: 0 })}
                          title="Quitar de la reserva"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(cuenta.datos?.saldoComprometido ?? 0) > 0 && (
                <div className="reserva-amount" style={{ color: "#6a5749" }}>
                  <span>Saldo comprometido en otras reservas</span>
                  <strong>{pesos(cuenta.datos?.saldoComprometido ?? 0)}</strong>
                </div>
              )}

              <div className="reserva-amount">
                <strong style={{ fontSize: "1.1rem" }}>Total selección: {pesos(totalSeleccion)}</strong>
              </div>

              <div
                style={{
                  background: totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) ? "#fde8e5" : "#eef6f0",
                  border: `1px solid ${totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) ? "#f5c2bc" : "#badfc6"}`,
                  borderRadius: "14px",
                  padding: "12px 14px",
                  margin: "14px 0",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) ? "#9c2e22" : "#1b5a3e",
                    letterSpacing: "0.5px",
                  }}
                >
                  Saldo disponible después de reservar
                </span>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) ? "#9c2e22" : "#173b31",
                    marginTop: "2px",
                  }}
                >
                  {pesos((cuenta.datos?.saldoDisponible ?? 0) - totalSeleccion)}
                </div>
                {totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9c2e22", fontWeight: 600 }}>
                    ⚠ El total supera el saldo disponible. Realiza un abono o disminuye las unidades.
                  </p>
                )}
              </div>

              <button
                type="button"
                className="btn btn-wide"
                style={{ width: "100%", marginTop: "8px" }}
                disabled={procesando || !alumno || totalSeleccion <= 0 || totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0)}
                onClick={reservar}
              >
                {procesando ? "Procesando…" : "Confirmar reserva"}
              </button>
            </aside>
          </div>
        </section>
      )}

      {seccion === "reservas" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
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
            className="back-link secondary"
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
            className="back-link secondary"
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
            className="back-link secondary"
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
